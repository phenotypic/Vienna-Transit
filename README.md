# Vienna-Transit

A web-based departure board displaying real-time transit information for any station in Vienna. The application retrieves a list of stations from the [Wiener Linien website](https://www.data.gv.at/katalog/dataset/wiener-linien-echtzeitdaten-via-datendrehscheibe-wien/resource/45f06281-5a9f-441c-9977-0fda610f963a#resources) and calculates the distance between the user’s location and each station using the [Haversine formula](https://en.wikipedia.org/wiki/Haversine_formula).

By default, it shows information for the nearest station, but users can select any station from a distance-sorted dropdown. Real-time departure data is fetched from the [Wiener Linien API](https://www.wienerlinien.at/ogd_realtime/doku/ogd/wienerlinien-echtzeitdaten-dokumentation.pdf) and updated every 30 seconds.

## Usage

Install Netlify CLI:
```
npm install -g netlify-cli
```

Clone the repository:
```
git clone https://github.com/phenotypic/Vienna-Transit.git
cd Vienna-Transit
```

Run Locally using the Netlify CLI:

```
netlify dev
```

## Notes

- Due to CORS restrictions on the Wiener Linien API, the application uses Netlify's proxy functionality to make API calls.
- The station list CSV is cached for 3 days to reduce unnecessary data transfer, while the real-time departure information API calls are always made instantly.
