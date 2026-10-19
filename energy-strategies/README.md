# Energy Strategies page-contained structure

Place `energy-strategies.html` at the repository root. Place the entire `energy-strategies/` folder next to it.

```text
SolarWithPhilip/
├── energy-strategies.html
└── energy-strategies/
    ├── sections/
    ├── css/
    ├── js/
    └── images/
```

The main page owns Google tracking, navigation, hero, final CTA/footer and loads the six fragments. The page-specific folder contains everything used only by Energy Strategies.

Test through the deployed site or a local web server because section fragments are loaded with `fetch()`.
