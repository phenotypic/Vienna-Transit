# Vienna-Transit

A web-based departure board that displays real-time transit information for any station in Vienna, using data from Wiener Linien.

The application retrieves a comprehensive list of transit station from the [Wiener Linien website](https://www.data.gv.at/katalog/dataset/wiener-linien-echtzeitdaten-via-datendrehscheibe-wien/resource/45f06281-5a9f-441c-9977-0fda610f963a#resources) and uses the Haversine formula to calculate the distance between the user's current location and each station. After determining the nearest station, the application fetches real-time departure information from the [Wiener Linien API](https://www.wienerlinien.at/ogd_realtime/doku/ogd/wienerlinien-echtzeitdaten-dokumentation.pdf). This data is dynamically updated every 30 seconds.

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
