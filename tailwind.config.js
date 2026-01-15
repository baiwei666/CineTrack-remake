/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
        "./electron/**/*.{ts,js}",
        "./*.{js,ts,jsx,tsx}"  // Root files like App.tsx if they are in root
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                // Custom colors can be added here
            }
        },
    },
    plugins: [],
}
