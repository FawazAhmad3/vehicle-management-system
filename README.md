# Vehicle Management System 🚗

A comprehensive web-based Vehicle Management System for tracking vehicle movement, fuel consumption (POL), and repair/maintenance records.

## Features

### 📋 Core Functionality

- **Movement Register**: Track vehicle trips, staff movements, and kilometers
- **POL Register**: Monitor fuel consumption, costs, and fuel coupons
- **Repair Register**: Manage vehicle repairs, tyre replacements, and battery changes
- **Dashboard Analytics**: Real-time insights and visualizations
- **Excel Export**: Export data to Excel files automatically

### 📧 Email Reporting (New Feature)

- Automated monthly email reports
- Customizable report content
- Email scheduling
- Test email functionality
- Email history tracking

### 🔒 Security Features

- Content Security Policy (CSP) headers
- XSS protection
- Clickjacking prevention
- Secure headers configuration
- Netlify security optimization

## Deployment

### Netlify Deployment

1. Push code to GitHub repository
2. Connect repository to Netlify
3. Deploy with default settings
4. Enable HTTPS (automatic on Netlify)

### Local Development

Open `index.html` in a modern web browser. No server required.

## Security

This project includes:

- Content Security Policy headers
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin
- Secure meta tags
- Robots.txt and sitemap.xml for SEO

## Browser Support

- Chrome 60+
- Firefox 60+
- Safari 12+
- Edge 79+

## License

This project is for educational and demonstration purposes.

## Support

For issues or questions, please check the documentation or create an issue in the repository.
