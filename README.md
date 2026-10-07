# Taxora local development

This project is a static HTML/JavaScript application. `index.html` is its local entry point. No build or npm dependency installation is required; Node.js and npm are sufficient.

Open PowerShell and run:

```powershell
Set-Location -LiteralPath 'C:\Users\moham\Desktop\TAXORA -GST'
npm run dev
```

Open **http://localhost:5173/** in your browser. Keep the terminal open; press Ctrl+C to stop the server. Refresh the browser after editing files. `npm start` runs the same server.

If PowerShell blocks `npm.ps1` under its execution policy, use `npm.cmd run dev` instead. No policy change is necessary.

To choose a different port:

```powershell
$env:PORT = '5174'
npm run dev
```

Then open http://localhost:5174/. The server listens only on the local computer. Some existing application features load libraries/fonts from external CDNs and need internet access.
