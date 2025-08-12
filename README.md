# WorkFlow Backend API

This is the backend API for the WorkFlow application, a social media automation platform. It provides authentication, user management, and integration with various social media platforms.

## Features

- User authentication (JWT)
- Social media integration (Facebook, Instagram, WhatsApp)
- Rate limiting
- Request validation
- Error handling
- Environment-based configuration

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- MongoDB (for production, optional for development)

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root directory based on `.env.example`
4. Start the development server:
   ```bash
   npm run dev
   ```

## Environment Variables

Copy `.env.example` to `.env` and update the values:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# Database Configuration (if using MongoDB)
# MONGODB_URI=mongodb://localhost:27017/workflow

# Social Media API Keys
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
INSTAGRAM_APP_ID=your_instagram_app_id
INSTAGRAM_APP_SECRET=your_instagram_app_secret
```

## API Endpoints

### Authentication

- `POST /api/auth/signup` - Register a new user
- `POST /api/auth/signin` - Login user
- `POST /api/auth/refresh-token` - Refresh access token
- `POST /api/auth/signout` - Logout user

### Users

- `GET /api/users/me` - Get current user profile
- `PUT /api/users/me` - Update current user profile
- `DELETE /api/users/me` - Delete current user account

## Development

- Run in development mode: `npm run dev`
- Lint code: `npm run lint`
- Format code: `npm run format`
- Run tests: `npm test`

## Deployment

### Render

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Set the following environment variables in the Render dashboard:
   - `NODE_ENV=production`
   - `JWT_SECRET`
   - `MONGODB_URI` (if using MongoDB)
   - Other required environment variables
4. Set the build command: `npm install`
5. Set the start command: `npm start`
6. Deploy!

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
