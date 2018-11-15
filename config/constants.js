/* Constant values which are used through out app */
const USER_IMAGE_PATH = "/uploads/user/"; // user image path
const DISTANCE = 25;
const NO_IMAGE_PATH = "site/no_image.jpg"; // for showing no image where image is not avaialable
const NOT_NULL_ARRAY = ['undefined', null, '', 'null'];
const DEFAULT_API_LANGUAGE = 'en'; // Declaring default language

module.exports = {
        APP_NAME: "My App", // Aplication name
        MAIL_FROM: "test@example.com", // Email id from mail has been sent
        USER_IMAGE_PATH: USER_IMAGE_PATH,
        API_LOGIN_ID: "",
        TRANSACTION_KEY: "",
        NO_IMAGE_PATH: NO_IMAGE_PATH,
        SERVER_KEY: '',// For push notifications
        PAGE_SIZE: 10,
        SMTP: { // SMTP Configurations
                SMTP_EMAIL: "smtp@example.com",
                SMTP_PASSWORD: "123456",
                SMTP_HOST: "smtp.example.com",
                SMTP_PORT: "587"
        },
        API_URL: 'http://localhost:8000',// app api url
        DISTANCE: DISTANCE,
        DEFAULT_API_LANGUAGE: DEFAULT_API_LANGUAGE
};