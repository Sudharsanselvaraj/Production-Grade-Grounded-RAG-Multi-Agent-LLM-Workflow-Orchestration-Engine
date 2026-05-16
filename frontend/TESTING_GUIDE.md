# Lumen AI Ops - Testing Guide

## Quick Start

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Run Development Server
```bash
npm run dev
```

### 3. View in Browser
- **Landing Page**: http://localhost:3000
- **Dashboard**: http://localhost:3000/dashboard

## What to Test

### Landing Page (http://localhost:3000)

✓ **Navigation**
- Click through menu items
- Test mobile menu (toggle at < 768px)
- Verify sticky navbar behavior

✓ **Hero Section**
- Check headline sizing
- Verify CTA buttons
- See workflow visualization

✓ **Features Grid**
- Hover over feature cards
- Verify icon rendering
- Check responsive grid (4 columns → 1 on mobile)

✓ **Charts**
- Scroll to "How It Works"
- Verify 7-step timeline
- Check layout on mobile

✓ **Footer**
- Scroll to bottom
- Test footer links
- Verify layout

### Dashboard (http://localhost:3000/dashboard)

✓ **Layout**
- Sidebar visible on desktop
- Top bar with search
- Notifications bell
- Health indicator (green dot)
- User avatar

✓ **KPI Cards**
- 6 cards visible
- Trending indicators
- Icon badges

✓ **Charts**
- Ticket volume bar chart
- Latency line chart
- Sentiment pie chart
- Category pie chart

✓ **Recent Activity**
- Activity feed
- Icons
- Timestamps

✓ **Navigation**
- Click sidebar items
- Verify active states
- Check icon rendering

## Responsive Testing

### Mobile (< 640px)
- Navbar menu collapses
- Sidebar hidden (needs mobile menu)
- Content stacks vertically
- Touch-friendly buttons

### Tablet (640px - 1024px)
- 2-column grids
- Navigation visible
- Charts responsive

### Desktop (> 1024px)
- 3-column grids
- Full navigation
- Sidebar + main content

## Browser DevTools

1. Open DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Test at different breakpoints:
   - Mobile: 375px
   - Tablet: 768px
   - Desktop: 1440px

## Color Verification

Check these colors in your browser:

- **Primary Green**: #A7F070 (buttons, badges)
- **Secondary Blue**: #2563EB (links, info)
- **Success Green**: #22C55E (positive metrics)
- **Warning Amber**: #F59E0B (warnings)
- **Danger Red**: #EF4444 (errors, escalations)

## Performance Checklist

- [ ] Page loads in < 3 seconds
- [ ] Animations are smooth (60fps)
- [ ] No console errors
- [ ] Images load properly
- [ ] Charts render correctly
- [ ] Hover effects work smoothly
- [ ] Responsive layout works
- [ ] Mobile navigation works

## Known Limitations (Phase 1-4)

- Dashboard data is mock/hardcoded (no real API)
- Sidebar menu is CSS-only (no mobile hamburger yet)
- Some pages not yet built (tickets, traces, evals)
- Search is non-functional
- Login/authentication not implemented
- Charts are not interactive (yet)

## Next Features Coming

- Ticket Queue table
- Ticket Detail view
- Workflow traces
- Evaluations dashboard
- Prompt management
- Settings pages
- Real data integration
- Authentication

## Troubleshooting

### Components not rendering?
- Check browser console for errors
- Verify Tailwind CSS is loaded (check DevTools)
- Ensure you're in the correct directory

### Styling issues?
- Clear browser cache (Ctrl+Shift+Del)
- Rebuild dev server (npm run dev)
- Check tailwind.config.js

### Charts not showing?
- Verify Recharts is installed
- Check browser console
- Ensure ResponsiveContainer has parent width

### Icons missing?
- Verify lucide-react is installed
- Check icon names in constants.js
- Ensure Icons import is correct

## Testing Checklist

### Design
- [ ] Colors match design spec
- [ ] Typography is correct
- [ ] Spacing is consistent
- [ ] Shadows are subtle
- [ ] Rounded corners look good
- [ ] No pixelated elements

### Functionality
- [ ] Navigation works
- [ ] Responsive design works
- [ ] Hover effects work
- [ ] Animations are smooth
- [ ] Forms work
- [ ] Buttons are clickable

### Performance
- [ ] Page loads quickly
- [ ] No layout shifts
- [ ] Smooth animations
- [ ] Efficient rendering
- [ ] Memory usage is low

### Accessibility
- [ ] Keyboard navigation works
- [ ] Focus states visible
- [ ] Color contrast good
- [ ] Form labels present
- [ ] ARIA labels helpful

## Feedback

Found issues? Note them down:
1. Component name
2. Issue description
3. Expected behavior
4. Steps to reproduce
5. Browser/device info

---

Happy testing! 🚀
