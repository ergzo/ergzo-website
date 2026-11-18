# ergzo-website
## IndexNow

`f0f8970bb5a9c188bf880dd4d26012f3.txt` is the IndexNow API key file. **Do not delete or rename it** — IndexNow verifies ownership by fetching it at
`https://www.ergzo.com/f0f8970bb5a9c188bf880dd4d26012f3.txt` and checking that its body is exactly the filename without `.txt`.

IndexNow pushes "this URL changed" notifications to **Bing, Yandex, Seznam and Naver** (and therefore to Copilot and other assistants built on the Bing index). **Google does not participate in IndexNow** — Google discovery still relies on the sitemap and on Search Console's URL Inspection tool.

Submit a single changed URL:

```
https://api.indexnow.org/indexnow?url=https://www.ergzo.com/blog-1.html&key=f0f8970bb5a9c188bf880dd4d26012f3
```

Submit the whole site after a redeploy:

```bash
curl -X POST https://api.indexnow.org/indexnow \
  -H 'Content-Type: application/json; charset=utf-8' \
  -d @indexnow-payload.json
```

A `200` or `202` response means accepted. Do not resubmit unchanged URLs — repeated submission of pages that have not changed is the one behaviour the protocol asks you to avoid.
