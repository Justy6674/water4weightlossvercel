# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/43a0978d-e2a6-414c-869d-a96d0c6a11ec

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/43a0978d-e2a6-414c-869d-a96d0c6a11ec) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/43a0978d-e2a6-414c-869d-a96d0c6a11ec) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

# Water4WeightLoss

A React application for tracking daily water intake and maintaining healthy hydration habits.

## Water Tracking System

The application includes a comprehensive water tracking system that helps users monitor their daily water intake, maintain streaks, and receive reminders to stay hydrated.

### Database Schema

#### Water Tracker Table

The `water_tracker` table stores individual water intake records:

```sql
CREATE TABLE public.water_tracker (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    intake_amount INTEGER NOT NULL CHECK (intake_amount >= 0),
    intake_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT unique_user_date UNIQUE (user_id, intake_date)
);
```

- `id`: Unique identifier for each water intake record
- `user_id`: References the user who created the record
- `intake_amount`: Amount of water consumed in milliliters
- `intake_date`: Date of the water intake
- `created_at`: Timestamp when the record was created
- `updated_at`: Timestamp when the record was last updated

Indexes:
- `water_tracker_user_id_idx`: Index on user_id for faster user-specific queries
- `water_tracker_intake_date_idx`: Index on intake_date for date-based queries
- `water_tracker_user_date_idx`: Compound index for user-date queries

### Profiles Table

- Ensure the `profiles` table has a UNIQUE or PRIMARY KEY constraint on `user_id`:

```sql
ALTER TABLE profiles
ADD CONSTRAINT profiles_user_id_unique UNIQUE (user_id);
```
- If you want `user_id` as PRIMARY KEY:
```sql
ALTER TABLE profiles
ADD PRIMARY KEY (user_id);
```

### Features

1. **Water Intake Logging**
   - Track daily water consumption
   - View historical intake data
   - Update or delete existing logs

2. **Statistics and Analytics**
   - Daily progress tracking
   - Streak monitoring
   - Weekly and monthly averages
   - Achievement tracking

3. **Reminders**
   - Customizable reminder frequency
   - Multiple notification methods (SMS, Email, WhatsApp)
   - Smart reminders based on daily progress

### React Hooks

The water tracking system is implemented using several custom React hooks:

1. **useWaterLogs**
   - Manages water intake records
   - Handles CRUD operations for water logs
   - Provides loading and error states

2. **useWaterStats**
   - Calculates water intake statistics
   - Tracks streaks and achievements
   - Provides progress analytics

3. **useWaterGoal**
   - Manages daily water intake goals
   - Handles goal updates and persistence
   - Provides goal-based progress tracking

4. **useWaterReminders**
   - Manages hydration reminders
   - Handles reminder settings and scheduling
   - Integrates with notification system

### Security

The water tracking system implements row-level security (RLS) policies to ensure users can only access their own data:

```sql
-- Users can only view their own water tracking data
CREATE POLICY "Users can view their own water tracking data"
    ON public.water_tracker
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can only insert their own water tracking data
CREATE POLICY "Users can insert their own water tracking data"
    ON public.water_tracker
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can only update their own water tracking data
CREATE POLICY "Users can update their own water tracking data"
    ON public.water_tracker
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
```

### Testing

The water tracking system includes comprehensive test coverage:

- Unit tests for all custom hooks
- Integration tests for data persistence
- Mock tests for network operations
- Edge case handling for streaks and achievements

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## Local Edge Function Testing

- To test reminder sending (SMS/WhatsApp/email) locally:
  1. Run your Supabase Edge Functions locally:
     ```sh
     supabase functions serve --env-file .env.local
     ```
  2. Ensure your `supabaseUrl` in `.env` or `supabase/client.ts` points to your local instance (e.g., `http://localhost:54321` for API, `http://localhost:54321/functions/v1` for Edge Functions).
  3. The app will call Edge Functions at the correct endpoint if configured.

- All errors and responses are logged to the browser console for debugging.
