function ensureTwoDigits(num: number) {
    if (num < 10) return `0${num}`;
    return `${num}`;
}

export const timestamp = function () {
    // Create a date object with the current time
    const now = new Date();

    // Create an array with the current month, day and time
    const date = [ensureTwoDigits(now.getMonth() + 1), ensureTwoDigits(now.getDate()), ensureTwoDigits(now.getFullYear())];

    // Create an array with the current hour, minute and second
    const time = [ensureTwoDigits(now.getHours()), ensureTwoDigits(now.getMinutes()), ensureTwoDigits(now.getSeconds())];

    // Return the formatted string
    return date.join("_") + "___" + time.join("_");
};

