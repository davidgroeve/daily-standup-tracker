# Daily Standup Tracker 🚀

A modern, web-based application for managing daily team standups, project roadmaps, and team productivity charts. Built with efficiency and aesthetics in mind.

## 🌟 Key Features

*   **Daily Standup Grid:** Visualize team updates for the entire week. Add updates, blockers, and link them to goals.
*   **Project Roadmap (Gantt):** visual timeline of project milestones with progress tracking and dependencies.
*   **Team Insights:** Analytics dashboard showing velocity, blocker trends, goal alignment, and workload distribution.
*   **Activity Log:** Track changes and updates across the platform.
*   **Team Management:** Manage team members and their roles (Accessible via User Profile).
*   **Secure:** Authentication and Data Persistence powered by Supabase.

## 📂 Project Structure

The project is organized into a clean directory structure:

*   **`js/`**: Core JavaScript logic.
    *   `app.js`: Main dashboard logic (Standup grid, Copy/Paste, State management).
    *   `roadmap.js`: Gantt chart and milestone logic.
    *   `supabase.js`: Supabase client configuration.
    *   `auth.js`: Authentication wrappers.
    *   `header.js`: Dynamic header injection and navigation logic.
*   **`css/`**: Styling.
    *   `style.css`: Main stylesheet containing the Design System (Variables, Glassmorphism, Components).
*   **`public/`**: Static assets (Images, Logos).
*   **Root Directory**:
    *   `index.html`: Main Standup Dashboard.
    *   `roadmap.html`: Roadmap View.
    *   `analytics.html`: Analytics Dashboard.
    *   `activity.html`: Activity Log.
    *   `login.html`: Authentication Page.

## 🚀 Getting Started

No build process is required! The application is built with standard HTML, CSS, and Vanilla JavaScript.

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-repo/daily-standup-tracker.git
    ```
2.  **Serve the directory:**
    You can use any static file server. For example:
    *   **VS Code:** Use "Live Server" extension.
    *   **Python:** `python -m http.server 8000`
    *   **Node:** `npx serve .`
3.  **Open in Browser:** Navigate to `http://localhost:8000` (or your server's port).

## 🛠️ Technology Stack

*   **Frontend:** HTML5, CSS3 (Variables, Flexbox/Grid), Vanilla JavaScript (ES6+).
*   **Backend / DB:** Supabase (PostgreSQL).
*   **Hosting:** Vercel (Recommended).

## 📝 Usage Tips

*   **Context Menu:** Right-click on Update Cards or Goals to Copy, Cut, or Paste items.
*   **Collapsible Sections:** Click the arrow next to "Goals - Targets" to collapse the section and save space.
*   **Team Management:** To add or Edit team members, click your User Avatar (top right) -> **Manage Team**.

## 🎨 Customization

Colors and themes are defined in `css/style.css` under the `:root` variables. You can easily adjust the color palette to match your brand.
