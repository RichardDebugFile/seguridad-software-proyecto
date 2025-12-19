import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as OAuth2Strategy } from 'passport-oauth2';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import bcrypt from 'bcrypt';
import pool from './database.js';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

// ========== Google OAuth Strategy ==========
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        const googleId = profile.id;

        // Check if user exists
        const existingUser = await pool.query(
          'SELECT * FROM users WHERE email = $1 OR (provider = $2 AND provider_id = $3)',
          [email, 'google', googleId]
        );

        if (existingUser.rows.length > 0) {
          // Update last login
          await pool.query(
            'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
            [existingUser.rows[0].id]
          );
          return done(null, existingUser.rows[0]);
        }

        // Create new user
        const newUser = await pool.query(
          `INSERT INTO users (email, username, provider, provider_id, display_name, picture_url)
           VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
          [
            email,
            profile.displayName,
            'google',
            googleId,
            profile.displayName,
            profile.photos[0]?.value,
          ]
        );

        return done(null, newUser.rows[0]);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

// ========== Keycloak OAuth Strategy ==========
// Custom strategy that supports dynamic prompt parameter
class KeycloakOAuth2Strategy extends OAuth2Strategy {
  authorizationParams(options) {
    const params = super.authorizationParams(options);
    // Allow passing prompt parameter dynamically (for SSO vs force login)
    if (options.prompt) {
      params.prompt = options.prompt;
    }
    return params;
  }
}

passport.use(
  'keycloak',
  new KeycloakOAuth2Strategy(
    {
      authorizationURL: `${process.env.KEYCLOAK_AUTH_SERVER_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/auth`,
      tokenURL: `${process.env.KEYCLOAK_AUTH_SERVER_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/token`,
      clientID: process.env.KEYCLOAK_CLIENT_ID,
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET,
      callbackURL: process.env.KEYCLOAK_CALLBACK_URL,
      scope: ['openid', 'profile', 'email'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Decode access token to extract roles
        const base64Url = accessToken.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const tokenPayload = JSON.parse(Buffer.from(base64, 'base64').toString());

        // Extract roles from token (supports both realm_access and roles formats)
        let roles = [];
        if (tokenPayload.realm_access && tokenPayload.realm_access.roles) {
          roles = tokenPayload.realm_access.roles;
        } else if (tokenPayload.roles) {
          roles = tokenPayload.roles;
        }

        // Filter only our custom roles (user, admin)
        const customRoles = roles.filter(role => ['user', 'admin'].includes(role));

        // Get user info from Keycloak
        const userInfoResponse = await axios.get(
          `${process.env.KEYCLOAK_AUTH_SERVER_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/userinfo`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        const keycloakUser = userInfoResponse.data;
        const email = keycloakUser.email || keycloakUser.preferred_username + '@keycloak.local';
        const keycloakId = keycloakUser.sub;

        // Check if user exists
        const existingUser = await pool.query(
          'SELECT * FROM users WHERE email = $1 OR (provider = $2 AND provider_id = $3)',
          [email, 'keycloak', keycloakId]
        );

        let user;
        if (existingUser.rows.length > 0) {
          // Update last login and roles
          await pool.query(
            'UPDATE users SET last_login = CURRENT_TIMESTAMP, roles = $1 WHERE id = $2',
            [customRoles, existingUser.rows[0].id]
          );
          user = { ...existingUser.rows[0], roles: customRoles };
        } else {
          // Create new user with roles
          const newUser = await pool.query(
            `INSERT INTO users (email, username, provider, provider_id, display_name, picture_url, roles)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [
              email,
              keycloakUser.preferred_username || email.split('@')[0],
              'keycloak',
              keycloakId,
              keycloakUser.name || keycloakUser.preferred_username,
              keycloakUser.picture || null,
              customRoles,
            ]
          );
          user = newUser.rows[0];
        }

        return done(null, user);
      } catch (error) {
        console.error('Keycloak authentication error:', error);
        return done(error, null);
      }
    }
  )
);

// ========== Local Strategy (Username/Password) ==========
passport.use(
  new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
    },
    async (email, password, done) => {
      try {
        const result = await pool.query(
          'SELECT * FROM users WHERE email = $1 AND provider = $2',
          [email, 'local']
        );

        if (result.rows.length === 0) {
          return done(null, false, { message: 'Usuario no encontrado' });
        }

        const user = result.rows[0];

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
          return done(null, false, { message: 'Contraseña incorrecta' });
        }

        // Update last login
        await pool.query(
          'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
          [user.id]
        );

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

// ========== JWT Strategy ==========
const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET,
};

passport.use(
  new JwtStrategy(jwtOptions, async (payload, done) => {
    try {
      const result = await pool.query('SELECT * FROM users WHERE id = $1', [
        payload.sub,
      ]);

      if (result.rows.length === 0) {
        return done(null, false);
      }

      return done(null, result.rows[0]);
    } catch (error) {
      return done(error, false);
    }
  })
);

// Serialize/Deserialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    done(null, result.rows[0]);
  } catch (error) {
    done(error, null);
  }
});

export default passport;
