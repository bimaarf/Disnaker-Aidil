module.exports = {
    apps: [
        {
            name: "Disnaker API Laravel port 8888",
            script: "artisan",
            interpreter: "php",
            args: "serve --host=127.0.0.1 --port=8888",
            cwd: "/var/www/disnaker.yz-course.com/backend",
            watch: false,
        },
    ],
};
