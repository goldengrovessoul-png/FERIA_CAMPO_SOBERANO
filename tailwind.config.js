/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                premium: {
                    blue: '#1e40af',
                    teal: '#0d9488',
                }
            }
        },
    },
    plugins: [],
}
