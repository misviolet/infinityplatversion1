# Supabase Login Authentication

A beautiful, production-ready login page that validates user credentials against a Supabase database.

## Features

- 🔐 Secure authentication using Supabase
- 🎨 Modern, responsive UI with smooth animations
- ⚡ Real-time form validation and error handling
- 📱 Mobile-friendly design
- 🔒 Session management with automatic logout
- ✨ Loading states and micro-interactions
- 📋 Task delegation and management system
- 🔍 Advanced filtering and search capabilities
- 📊 Dashboard with analytics overview

## Setup Instructions

### 1. Supabase Setup

1. Click the "Connect to Supabase" button in the top right of this interface
2. Create a new Supabase project or select an existing one
3. Copy your project URL and anon key from the project settings

### 2. Create the Required Tables

The application requires two main tables: `login` for authentication and `tasks` for the delegation system.

#### Login Table
In your Supabase dashboard, go to the SQL Editor and run this SQL to create the login table:
```sql
CREATE TABLE login (
    ID SERIAL PRIMARY KEY,
    Name VARCHAR(255),
    user_name VARCHAR(255) UNIQUE,
    password VARCHAR(255),
    Role VARCHAR(50)
);

-- Insert sample data
INSERT INTO login (Name, user_name, password, Role) VALUES
('John Doe', 'admin', 'admin123', 'Administrator'),
('Jane Smith', 'user1', 'password1', 'User'),
('Bob Johnson', 'user2', 'password2', 'Manager');

-- Enable Row Level Security
ALTER TABLE login ENABLE ROW LEVEL SECURITY;

-- Create policy to allow reading login data
CREATE POLICY "Allow login verification" ON login
FOR SELECT USING (true);
```

#### Tasks Table
The tasks table is automatically created through migrations. It includes:
- Task delegation and assignment
- Priority levels (High, Medium, Low)
- Status tracking (Pending, Completed, Need Clarity, etc.)
- Support document management
- Comments and completion tracking
### 3. Configure Environment Variables

1. Copy `.env.example` to `.env`
2. Fill in your credentials:
   ```
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

### 4. Install and Run

```bash
npm install
npm run dev
```

## Usage

### Authentication
1. Open the application in your browser
2. Enter a username and password that exists in your Supabase login table
3. Click "Sign In" to authenticate
4. Upon successful login, you'll be redirected to the dashboard

### Task Management
1. **Dashboard**: Overview of your tasks and system analytics
2. **Delegation**: Create, assign, and manage tasks
   - **My Tasks**: View tasks assigned to you
   - **Assigned by Me**: View tasks you've assigned to others
   - **Filters**: Search and filter by priority, date, and stakeholder
   - **Task Completion**: Mark tasks as completed with comments and support documents
## Security Considerations

- **Database Security**: Supabase provides built-in security with Row Level Security (RLS)
- **HTTPS**: Always use HTTPS in production to protect credentials in transit
- **Rate Limiting**: Implement rate limiting to prevent brute force attacks
- **Database Permissions**: Use proper RLS policies to restrict data access

## Customization

- **Styling**: Modify the Tailwind classes in the components for different visual themes
- **Database Schema**: Update the table structure and queries in `supabaseAuth.ts`
- **Validation**: Add additional validation rules in the `LoginForm` component
- **Dashboard**: Customize the `Dashboard` component for your specific use case

## Troubleshooting

1. **Environment Variables**: Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set correctly
2. **Database Access**: Verify the login table exists and has proper RLS policies
3. **Connection Issues**: Check your internet connection and Supabase project status
4. **Network Errors**: Check your internet connection and API quotas

## Production Deployment

For production use, consider:
- Using Supabase's built-in security features
- Implementing proper session management
- Adding rate limiting and security headers
- Using environment-specific configuration
- Implementing proper error logging and monitoring