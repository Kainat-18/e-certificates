# Hostinger setup

1. Back up the existing website files before uploading the changed files.
2. In hPanel, open Databases and create a MySQL database and database user. Save the database name, username, password and host shown there.
3. Open that database in phpMyAdmin and import `database.sql`.
4. Edit `config.php` with the database connection details. Never put the password in HTML or JavaScript.
5. Upload `index.html`, `form.php`, `api.php`, `config.php`, `css/form.css`, `js/form.js` and `js/verify.js` into the website directory (normally `public_html`). Keep the existing CSS, images and fonts.
6. Open `https://YOUR-DOMAIN/form.php`, submit a sample record and open the generated link. Confirm all fields match. Refresh the link to confirm the record is saved permanently.
7. Check missing/invalid links, invalid dates and database failure messages. Remove the sample row through phpMyAdmin when finished.

Requires PHP 8+ with PDO MySQL and a MySQL/MariaDB database supporting JSON. The form is public. Every submission is labelled as unreviewed; it does not authenticate a certificate or allow visitors to set approval status. Records are readable by anyone holding their random link. There is no listing endpoint or automatic migration of existing Firebase records.

Session checks and a hidden spam field provide basic submission protection. No admin review, editing, deletion UI or CAPTCHA service is included. PHP is not installed in the current local workspace, so final database and PHP runtime checks must be completed on hosting.
