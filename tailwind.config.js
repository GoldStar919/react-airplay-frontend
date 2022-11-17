// tailwind.config.js
module.exports = {
    purge: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
    darkMode: false, // or 'media' or 'class'
    theme: {
      extend: {
        gridTemplateColumns: {
           'top-header': '100px 1fr 300px',
           'play-pause': '420px 1fr',
           'video-section': 'minmax(700px,65%) minmax(450px,35%)',
           'video-controls': '2rem 5rem 2rem 1fr',
           'tableItems': 'repeat(8, minmax(130px,1fr))'
          },
        gridTemplateRows: {
           'outer-section': '100px auto'
          },
          zIndex: {
            '1100': 1100,
            '2000':2000
          }
      },
    },
    variants: {
      extend: {},
    },
    plugins: [],
  }