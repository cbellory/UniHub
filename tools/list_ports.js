const { exec } = require('child_process');

exec('sudo lsof -i -P -n | grep LISTEN', (error, stdout, stderr) => {
    if (error) {
        console.error(`exec error: ${error}`);
        return;
    }
    console.log(stdout);
});
