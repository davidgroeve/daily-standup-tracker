# 📋 Daily Standup Tracker

A beautiful, modern web application for tracking daily standup meetings with your team. Features a weekly grid view, team member management, and goals tracking with local storage persistence.

## ✨ Features

- **Weekly Grid View**: Visualize the entire week (Monday-Friday) at a glance
- **Team Member Management**: Add, edit, and remove team members with color-coded cards
- **Daily Updates**: Click any cell to add or edit daily standup updates
- **Goals & Targets**: Track weekly goals and objectives
- **Week Navigation**: Easily navigate between weeks
- **Local Storage**: All data is automatically saved in your browser
- **Modern Design**: Dark theme with glassmorphism effects and smooth animations
- **Responsive**: Works on desktop, tablet, and mobile devices

## 🚀 Getting Started

### Option 1: Open Locally
Simply open `index.html` in your web browser. That's it!

### Option 2: Use a Local Server
For the best experience, use a local server:

```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx http-server

# Using PHP
php -S localhost:8000
```

Then open `http://localhost:8000` in your browser.

### Option 3: Deploy for Team Sharing

To share with your team, deploy to one of these free hosting platforms:

#### **GitHub Pages** (Recommended)
1. Create a new GitHub repository
2. Upload all files (`index.html`, `style.css`, `app.js`)
3. Go to Settings → Pages → Select main branch
4. Your app will be live at `https://yourusername.github.io/repo-name`

#### **Netlify**
1. Drag and drop the folder to [netlify.com/drop](https://app.netlify.com/drop)
2. Get instant URL to share with your team

#### **Vercel**
1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in the project folder
3. Follow the prompts

## 📖 How to Use

### Managing Team Members
1. Click **"+ Add Team Member"** in the header
2. Enter the name and select a color
3. Click **Save**
4. To edit: Click on a team member tag
5. To remove: Click the × on the team member tag

### Adding Daily Updates
1. Click on any empty cell in the grid (shows "+ Add update")
2. Enter your updates, one per line
3. Click **Save**
4. Updates automatically show timestamp

### Editing Updates
- Click on any existing update card to edit or delete it

### Managing Goals
1. Click **"+ Add Goal"** in the Goals section
2. Enter your weekly goal or target
3. Click **Save**
4. Click on any goal card to edit
5. Click × to remove a goal

### Week Navigation
- Use the **◀** and **▶** buttons to navigate between weeks
- The current week number and date range are displayed in the header

## 💾 Data Storage

All data is stored locally in your browser using `localStorage`. This means:
- ✅ Your data persists between sessions
- ✅ No internet connection required
- ✅ No backend or database needed
- ⚠️ Data is per-browser (not synced across devices)
- ⚠️ Clearing browser data will delete your standups

### Future Enhancement
To enable multi-user access and sync across devices, you can add a backend with:
- Node.js + Express + MongoDB/PostgreSQL
- Firebase Realtime Database
- Supabase
- Any other backend of your choice

## 🎨 Customization

### Colors
Edit the color palette in `style.css`:
```css
:root {
  --color-gustavo: #FFB5C5;
  --color-david: #B5E7F5;
  /* Add more colors as needed */
}
```

### Team Member Colors
The app includes 6 pre-defined colors. To add more, edit the `COLORS` array in `app.js`:
```javascript
const COLORS = [
  { name: 'custom', value: '#YOUR_COLOR' },
  // Add more colors
];
```

## 🛠️ Tech Stack

- **HTML5**: Semantic markup
- **CSS3**: Custom properties, Grid, Flexbox, Animations
- **Vanilla JavaScript**: No frameworks or dependencies
- **Google Fonts**: Inter font family

## 📱 Browser Support

Works on all modern browsers:
- Chrome/Edge (recommended)
- Firefox
- Safari
- Opera

## 📄 License

Free to use and modify for your team!

## 🤝 Contributing

Feel free to customize this app for your team's specific needs!

---

**Made with ❤️ for better team collaboration**
