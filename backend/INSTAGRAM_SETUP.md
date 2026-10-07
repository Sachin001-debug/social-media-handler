# Instagram connection setup

Configure `FB_APP_ID`, `FB_APP_SECRET`, `IG_REDIRECT_URI`, and `FRONTEND_URL`
in the backend environment. `IG_REDIRECT_URI` must exactly match the Meta
dashboard's valid OAuth redirect URI and the callback route, for example:
`http://localhost:5000/api/instagram/callback`.

For Facebook Login for Business, set `IG_LOGIN_CONFIG_ID` to the configuration
ID from Meta's **Facebook Login for Business → Configurations** page. The
configuration must request `pages_show_list`, `instagram_basic`, and
`instagram_content_publish` (as well as any Page permissions needed to list
Pages). If no configuration ID is set, the app uses the standard OAuth
permission scope instead.

Run `npm run migrate` from the `backend` directory to create the Instagram
account table. Only Instagram Business or Creator accounts linked to a
Facebook Page can be connected for publishing; a personal account must first
be switched to a professional account in Instagram.
