---
# vim:set expandtab shiftwidth=2 filetype=markdown:
# SPDX-License-Identifier: GPL-3.0-only

#
#
# ~chewygumxx/waybar-weather.git
# ::: :/.claude/skills/visualcrossing-weather-api/references/weather-api-doc.md
#
#
---

# Visual Crossing Weather API Documentation

### Introduction

The Timeline Weather API provides unified access to weather data across the globe. It is designed for fast performance, global coverage, and hyperlocal accuracy. A single [weather data API](https://www.visualcrossing.com/weather-api/) call can return weather data spanning any time range — past, present, or future — by automatically combining historical observations, current 15-day forecasts, and long-term statistical forecasts into a consistent dataset.

##### Ultra-Low-Latency Forecast Access

For ultra-low-latency forecast queries, consider the [Timeline LLX endpoint](https://www.visualcrossing.com/resources/documentation/weather-api/timeline-llx-weather-api/). It provides the same core forecast data as the Timeline API, optimized for fast response times in latency-sensitive applications.

##### Key Timeline Weather API Features

- **Simple GET Requests** – All queries use standard HTTP GET requests with clear parameters.
- **Flexible Time Windows** – Retrieve data for any period, including historical ranges, the current date, or future forecasts.
- **Multiple Location Options** – Query by address, latitude/longitude, postal code, or location ID.
- **Comprehensive Weather Elements** – Access daily, hourly, and statistical data, plus alerts and astronomical details such as sunrise, sunset, and moon phase.
- **Dynamic Date Keywords** – Use keywords like `today`, `yesterday`, or `last30days` to simplify time-based queries.
- **Customizable Output Formats** – Choose between structured JSON for integration or CSV for direct analysis.

##### Data Coverage

The Timeline API provides global coverage with 2km accuracy in many places. The Timeline API automatically selects the best available data sources for each query to ensure accuracy and completeness. Depending on the requested time range, the response may include:

- **Current conditions** – Real-time observations from global weather stations and models.
- **Daily data** – Historical, forecast, and statistical weather summaries.
- **Hourly data** – Historical observations and up to 15-day forecasts.
- **Weather alerts** – Active warnings for the requested location and period.
- **Astronomical data** – Sunrise, sunset, and moon phase details.

##### Output Format

All responses are returned in a consistent JSON structure, allowing applications to consume weather data without needing to manage multiple data sources or formats. For simpler integration into spreadsheets or databases, results can also be returned as CSV text.

#### Generate Code with our AI Code Generator

*Our new AI-powered code generator instantly creates working code tailored to your requirements. Try the [AI code generator tool](https://www.visualcrossing.com/support/weather-api-ai-code-generator/) today and start building faster.*

#### Latest features and recent changes

We continue to invest heavily in enhancing the Timeline Weather API and expanding its underlying data sources. Recent improvements include:

- **Wildfire events** – include [wildfire events](https://www.visualcrossing.com/resources/documentation/weather-api/wildfire-events-in-the-timeline-weather-api/) into the events data.
- **MCP Server (Model Context Protocol)** — [MCP server](https://www.visualcrossing.com/resources/documentation/weather-api/visual-crossing-mcp-guide/) for AI assistant integration.
- **Multiple API Keys** – Add [multiple API keys](https://www.visualcrossing.com/resources/documentation/managing-team-users-and-api-keys/) for different environments.
- **Historical Weather Forecast API** – the new [Historical Forecast API](https://www.visualcrossing.com/resources/documentation/weather-api/historical-forecast-api/) offers even easier access to our Historical Weather Forecast models.
- **Weather Maps API** – see our new [Weather Maps API](https://www.visualcrossing.com/resources/documentation/weather-api/weather-maps-api/) that provides ready-to-use weather map tiles, stitched images, and matching legends suitable for web maps, dashboards, and applications.
- **Low Latency Endpoint** – the new [timelinellx endpoint](https://www.visualcrossing.com/resources/documentation/weather-api/timeline-llx-weather-api/) provides ultra low latency responses for forecast queries. Perfect for apps, IoT and other embedding.
- **Flat JSON output format** – the new Flat JSON output format provides for a significantly smaller data transfer size for lightning fast transmission.
- **Improved ability to add or remove weather elements** using the add: and remove: prefixes.
- **Radar-Based Precipitation Estimates**  
	You can now [include radar-derived precipitation data directly in your datasets](https://www.visualcrossing.com/resources/documentation/weather-data/how-to-include-weather-radar-data-in-weather-datasets/), providing improved estimates of precipitation amount and intensity.
- **New Programmatic Dataset APIs**  
	[New APIs](https://www.visualcrossing.com/resources/documentation/weather-api/stored-dataset-api-documentation/) have been added to enable programmatic submission, modification, and download of stored datasets, streamlining automated workflows.
- **Sub-Hourly Data Support**  
	The Timeline Weather API now supports [sub-hourly data with minute-level granularity](https://www.visualcrossing.com/resources/documentation/weather-api/sub-hourly-data-in-the-timeline-weather-api/), offering more precise short-term forecasts and observations.

For a full list of additions to the Timeline Weather API, please see the [changelog](https://www.visualcrossing.com/resources/documentation/weather-api/weather-api-changelog/).

#### Build Queries in our Interactive API Query Builder

*The [Weather Query Builder page](https://www.visualcrossing.com/weather-query-builder/) includes a full, interactive query builder so you can create queries and see the live results directly in your browser.*

### Creating a weather API request

#### Base URL

```html
https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/
```

#### Endpoints

The possible endpoints of the Timeline Weather API requests are as follows:

- `/timeline/[location]` – forecast queries.
- `/timeline/[location]/[date1]/[date2]` – queries for a specific date range.

#### Main Format of the URL

All requests to the Timeline Weather API use the following the form:

```html
https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/[location]/[date1]/[date2]?key=YOUR_API_KEY
```

### Request Parameters

#### Main Parameters (Path Parameters)

**location (required)** – is the address, partial address or latitude,longitude location for which to retrieve weather data. You can also use US ZIP Codes. If you would like to submit multiple locations in the same request, consider our [Multiple Location Timeline Weather API](https://www.visualcrossing.com/resources/documentation/weather-api/using-the-timeline-weather-api-with-multiple-locations-in-the-same-request/).

**date1 (optional)** – is the start date for which to retrieve weather data. If a **date2** value is also given, then it represents the first date for which to retrieve weather data. If no **date2** is specified then weather data for a single day is retrieved, and that date is specified in **date1**. All dates and times are in local time of the **location** specified. Dates should be in the format yyyy-MM-dd. For example 2020-10-19 for October 19th, 2020 or 2017-02-03 for February 3rd, 2017.

Instead of an exact date, you can specify a [dynamic date period](https://www.visualcrossing.com/resources/documentation/weather-api/using-the-time-period-parameter-to-specify-dynamic-dates-for-weather-api-requests/). See below for more details. You may also supply the in “UNIX time”. In this case provide the number of seconds since 1st January 1970 UTC. For example 1612137600 for Midnight on 1st February 2021.

You can also request the information for a specific time for a single date by including time into the date1 field using the format yyyy-MM-ddTHH:mm:ss. For example 2020-10-19T13:00:00.

The results are returned in the ‘currentConditions’ field and are truncated to the hour requested (i.e. 2020-10-19T13:59:00 will return data at 2020-10-19T13:00:00).

**date2 (optional)** – is the end date for which to retrieve weather data. This value may only be used when a **date1** value is given. When both **date1** and **date2** values are given, the query is inclusive of **date2** and the weather data request period will end on midnight of the **date2** value. All dates and times are in local time of the specified location and should be in the format yyyy-MM-dd.

When no **date1** or **date2** is specified, the request will retrieve the forecast at the requested **location** for the next 15 days.

#### Additional Parameters (Query or POST Parameters)

The following are specified as HTTP query parameters (they may also be passed in a POST query).

**key (required)** – your API key. Sign up for a free account using our [Weather Data Services](https://www.visualcrossing.com/weather-query-builder/) page.

**unitGroup (optional)** – The system of units used for the output data.  
Supported values are `us`, `uk`, `metric`, and `base`. See [Unit groups and measurement units](https://www.visualcrossing.com/resources/documentation/weather-api/unit-groups-and-measurement-units/) for more information. Defaults to US system of units.

**lang (optional)** – Sets the language of the translatable parts of the output such as the conditions field. Available languages include: ar (Arabic), bg (Bulgiarian), cs (Czech), da (Danish), de (German), el (Greek Modern), en (English), es (Spanish) ), fa (Farsi), fi (Finnish), fr (French), he Hebrew), hu, (Hungarian), it (Italian), ja (Japanese), ko (Korean), nl (Dutch), pl (Polish), pt (Portuguese), ru (Russian), sk (Slovakian), sr (Serbian), sv (Swedish), tr (Turkish), uk (Ukranian), vi (Vietnamese) and zh (Chinese). In addition passing in ‘id’ will result in the raw descriptor IDs.See [How to create or modify language files](https://www.visualcrossing.com/resources/documentation/weather-api/how-to-create-or-modify-language-files/) for more information on how to help add additional languages.

**include (optional)** – Specifies the sections you would like to include in the result data. This allows you to reduce query cost and latency. Specify this as a comma separated list. For example: `&include=obs,fcst` to include the historical observations and forecast data. The options are:

- **days** – daily data
- **hours** – hourly data
- **minutes** – minutely data (beta). See [Requesting sub-hourly data in the Timeline Weather API](https://www.visualcrossing.com/resources/documentation/weather-api/sub-hourly-data-in-the-timeline-weather-api/).
- **alerts** – weather alerts
- **current** – current conditions or conditions at requested time.
- **events** – [historical events such as a hail, tornadoes, wind damage and earthquakes](https://www.visualcrossing.com/resources/documentation/weather-101/how-to-retrieve-hail-tornado-wind-damage-and-earthquakes-events-in-the-weather-api/) (not enabled by default)
- **obs** – historical observations from weather stations
- **remote** – historical observations from remote source such as satellite or radar
- **fcst** – forecast based on 16 day models.
- **stats** – historical statistical normals and daily statistical forecast
- **statsfcst** – use the full statistical forecast information for dates in the future beyond the current model forecast. Permits hourly statistical forecast.

**elements (optional)** – Specifies the specific weather elements you would like to include in the response as a comma separated list. For example, `&elements=tempmax,tempmin,temp` will request the only the tempmax, tempmin and temp response elements. For the full list of available elements, see the response below.

**options (optional)** – Specifies additional options on the requests to either indicate the type of data or format of the output. Supported values include:

- **nonulls** – remove all null values from the JSON response
- **noheaders** – removes the header row from the CSV response

**contentType (optional)** – indicates the output format for the API. By default the output is formated in JSON. You can also set `contentType=csv` to retrieve CSV formatted data.Note that CSV format does not support the full JSON output due to the format limitations. You must use the **include** parameter to indicate which section you would like to retrieve. CSV include parameters support are days, hours, alerts, events and current.

**iconSet (optional)** – used to choose which icons IDs are populated. For more information see [Defining the icon set parameter in the Weather API](https://www.visualcrossing.com/resources/documentation/weather-api/defining-icon-set-in-the-weather-api/).

**timezone** **(optional)** – specifies the timezone of the input and result dates and times. When not specified, all date times are considered local times. If you would like to specify that all dates are entered as UTC dates and times, use `timezone=Z` parameter.

**maxDistance (optional)** The maximum distance in meters used to search for local weather stations ( By default, 50 miles or approximately 80km (80,467m). This setting is combined with the `maxStations` parameter to find local weather stations.

**maxStations (optional)** The maximum number of weather stations used to calculate a weather record (default 3). Closer weather stations are weighted significantly more heavily than farther stations.

**elevationDifference (optional)** The maximum elevation difference in meters between the requested location and weather stations. Any weather station that is either lower or higher than more than this setting will be excluded. Default is turned off.

**locationNames (optional)** provides alternative name for the location requested. This is typically used by users who need to be able to join the API results back to a dataset. For example, you may pass a store database ID in this parameter so that you can populate the weather forecast for that store.

**forecastBasisDate (optional, requires historical forecast license)** – specifies the date when the weather forecast model was run. For example, if you specify `2021-06-01`, then the data from 2021-06-01 to 2021-06-15 will use the weather forecast produced on June 1st, 2021. For more information see [How to query weather forecasts from the past](https://www.visualcrossing.com/resources/documentation/weather-data/how-to-query-weather-forecasts-from-the-past-historical-forecasts/).

**forecastBasisDay (optional, requires historical forecast license)** – specifies the forecast day for the date1 parameter above. For example, if you specify the start date as 2021-06-05 and a forecastBasisDay value of `5`, then the value for 2021-06-06 will be the 5th day forecast (i.e. it will be based on the weather forecast produced five days earlier (2021-06-01). You can use this parameter to quickly find the forecast that was predicted for a particular day on multiple days (for example the 5, 3 and 1 day forecast). For more information see [How to query weather forecasts from the past](https://www.visualcrossing.com/resources/documentation/weather-data/how-to-query-weather-forecasts-from-the-past-historical-forecasts/).

**forecastDataset** (optional, requires forecast data access) – overrides the automatic data-source selection and returns the forecast from one or more specific underlying weather models instead of the default Visual Crossing blended forecast.

By default, the Timeline API automatically combines the best available data sources for each location and time (observations, a multi-model blended forecast, and statistical forecast) into a single, seamless result. The forecastDataset parameter lets you bypass this blend and request the raw output of an individual model. This is useful for model comparison, verification, and applications that require a single, consistent forecast source.

Specify one model ID, or a comma-separated list of model IDs to retrieve several models in the same request. For example:

`&forecastDataset=gfs`

`&forecastDataset=gfs,ecmwf,hrrr`

Commonly available model IDs include:

- `gfs` – NOAA Global Forecast System (global)
- `gfes` – NOAA GFS Ensemble (global)
- `nam` – NOAA North American Mesoscale model
- `hrrr` – NOAA High-Resolution Rapid Refresh (short-range, CONUS)
- ndfd – US National Digital Forecast Database
- `ecmwf` – ECMWF forecast (global)
- `ecmwfaifs` – ECMWF AI/ML forecast (AIFS)
- `iconeu` – DWD ICON-EU (Europe)
- `iconglobal` – DWD ICON (global)
- `icond2` – DWD ICON-D2 (high-resolution, Central Europe)
- `ukmo_global` – UK Met Office global model
- `gdps` – Environment Canada Global Deterministic Prediction System
- `usblended` / `vcusblended` – US regional blended forecasts
- `era5core` – ECMWF ERA5 reanalysis (historical dates only)

When forecastDataset is omitted, the standard blended forecast is returned. When it is supplied, only the requested model(s) are returned.

**Important limitations**

Because you are requesting a specific model rather than the automatically blended result, the following limitations apply:

1. **Coverage is not global for every model.** Many models are regional (for example, `hrrr`, `nam`, ndfd, `usblended`, and `vcusblended` cover the United States, while `iconeu` and `icond2` cover Europe). Requesting a model outside its geographic domain may return empty or partial data.
2. **Time ranges vary by model.** Each model has its own forecast horizon and, for some, a limited historical window. Short-range models (such as `hrrr`) cover only the near term, while reanalysis datasets (such as `era5core`) are available only for historical dates and not for the future. Portions of your requested date range that fall outside a model’s available period may be empty.
3. **Models may be temporarily unavailable for operational reasons.** Upstream data feeds can be delayed, incomplete, or offline, and models are periodically added, retired, or changed. A model that returns data today may return partial or no data during such periods. Applications should handle empty results gracefully and should not assume any single model is available at all times.

**Example**

Retrieve the hourly GFS forecast for London so they can be compared side by side:

`https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/London,UK?key=YOUR_API_KEY&include=hours&forecastDataset=gfs`

##### Degree days parameters (Query Parameters)

**degreeDayTempFix** – The temperature at which to start the degree day season if no season start and end dates are specified. For example, if the fix temperature is 32F (OC), then the cumulative degree days will reset to zero on the last 32F temperature of the winter. This defines the growing season for growing degree days.

**degreeDayStartDate** – Fixes the start of the degree day season based on fixed dates of the format yyyy-M-d (eg 1990-3-1 for 1st March). Default=not specified.

**degreeDayTempMaxThreshold** – Defines the maximum temperature that is considered for the calculation. Any temperature above this temperature will be set to the maximum threshold temperature. Default value=not set.

**degreeDayTempBase** – The degree day base temperature. Default value is set to 10C/50F

**degreeDayInverse** – Calculate the inverse degree days so colder temperatures contribute more degree days. Used for heating degree days. Default=false.

**degreeDayMethod (beta)** – The method used for calculating the degree days. Values include average, sine, doublesine, triangle and doubletriangle. Default value is set to average.

### Request Examples

#### Forecast Request Example

The following will retrieve the weather forecast for London, United Kingdom for the next 15 days, starting at midnight at the start of the current day (local time of the requested location).

```html
https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/London,UK?key=YOUR_API_KEY
```

#### Forecast Request Example using longitude and latitude

You may also pass the location as a “latitude,longitude” value. For example: 38.9697,-77.385

```html
https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/38.9697,-77.385?key=YOUR_API_KEY
```

#### Date Range Request Example

The following will retrieve the weather data for London, UK from October 1st, 2020 to December 31st, 2020 (inclusive).

```html
https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/London,UK/2020-10-01/2020-12-31?key=YOUR_API_KEY
```

Assuming the current date is November 1st, 2020, the result will include historical observations from October 1st to 31st, then 15 days of weather forecast and finally the remaining days will include the statistical forecast based on processing years of historical observations.

#### Date Range Request Example using UNIX Time (Epoch Time)

The following shows the same query using UNIX format of seconds since the 1970 UNIX time epoch. Note that these times are seconds in the UTC (GMT/Z) time zone.

```html
https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/London,UK/1601510400/1609372800?key=YOUR_API_KEY
```

#### Specific Time Request Example

The following will retrieve the weather data for London, UK for the 15th December 2020 and will request the current conditions property be populated using the conditions at 13:00 local time (1pm local time).

```html
https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/London,UK/2020-12-15T13:00:00?key=YOUR_API_KEY
```

The above example will include the daily and hourly detail for the day of the current conditions (2020-12-15 in this case). This query cost will therefore be 24. If you only need the specific time data, and don’t need the hourly detail, you can reduce the query costing using the include parameter. In this case the query cost will be one.

```html
https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/London,UK/2020-12-15T13:00:00?key=YOUR_API_KEY&include=current
```

#### Dynamic period Request Example

Rather the specify and date range, you can also specify and [dynamic period](https://www.visualcrossing.com/resources/documentation/weather-api/using-the-time-period-parameter-to-specify-dynamic-dates-for-weather-api-requests/). A request based on a dynamic period will automatically adjust based on the period. In this example, we will use the dynamic period value “last30days” to retrieve data for the most recent 30 days.

```html
https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/London,UK/last30days?key=YOUR_API_KEY
```

Other dynamic period values include “today”, “yesterday”, and “lastyear”. For a complete list of options and additional example, please see the [dynamic period](https://www.visualcrossing.com/resources/documentation/weather-api/using-the-time-period-parameter-to-specify-dynamic-dates-for-weather-api-requests/) article.

#### Using the options parameter to request specific data sections

By default both daily and hourly data is included in the response along with all the response weather data elements (see below). To reduce the size of the result JSON for lower query cost, reduced network transfer and faster client processing, the `options` and `elements` parameters may be used.

This example requests only the daily data:

```html
https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/London,UK/last30days?key=YOUR_API_KEY&include=days
```

This example requests only the current conditions data:

```html
https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/London,UK/last30days?key=YOUR_API_KEY&include=current
```

#### Using the elements parameter to modify the weather elements

This example requests the daily data with only temperature elements:

```html
https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/London,UK/last30days?key=YOUR_API_KEY&include=days&elements=tempmax,tempmin,temp
```

You may also add or remove elements from the default list of elements. The helps avoid listing a long list of elements when you only require to add or remove a small number.

```html
https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/London,UK/last30days?key=YOUR_API_KEY&include=days&elements=add:aqius,remove:windgust
```

#### Degree day elements list example

The following includes the daily ‘degree days’ information for the requested location and date range (in this case the last 30 days).

```html
https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/London,UK/last30days?
unitGroup=us&key=YOUR_API_KEY&include=days&elements=datetime,tempmax,tempmin,degreedays,accdegreedays&degreeDayTempMaxThreshold=86&degreeDayTempBase=50
```

For more information on our growing, cooling and heating degree day options, please see our [degree day page](https://www.visualcrossing.com/resources/documentation/weather-api/degree-day-weather-api/).

#### Industry elements - solar, marine and agriculture

The Timeline API can be extended to include advanced agriculture, horticulture and energy elements. These include evapotranspiration, soil temperature & moisture, advanced solar radiation and higher altitude wind speeds and directions.

To include these advanced industry elements, please see our [Agriculture and Horticulture](https://www.visualcrossing.com/resources/documentation/weather-api/agriculture-elements-in-the-timeline-weather-api/) and [Wind and Solar Energy](https://www.visualcrossing.com/resources/documentation/weather-api/energy-elements-in-the-timeline-weather-api/) pages.

### Response Format

The Weather API offers the following output formats. These are specified via the ‘contentType’ parameter (for example &contentType=json)

- json – an object-based JSON format suitable for easily parsing into a object structure.
- flatjson – an alternative JSON format that is designed to be be as light-weight as possible.
- csv – comma separated values where each column is a weather element.

Both JSON and FLATJSON formats support including multiple sections of data such as days, hours, minutes etc. into a single request. The CSV format requires the include parameter to indicate which section should be included (for example ‘include=days’).

#### JSON response format

```html
{
  "queryCost": 168,
  "latitude": 38.9598,
  "longitude": -77.3545,
  "resolvedAddress": "Reston, VA, United States",
  "address": "Reston,VA",
  "timezone": "America/New_York",
  "tzoffset": -4.0,

  "days": [
    {
      "datetime": "2025-06-01",
      "tempmax": 68.0,
      "tempmin": 44.9,
      "temp": 58.6,
      "humidity": 56.4,
      "precip": 0.0,
      "windspeed": 14.4,
      "pressure": 1009.5,
      "cloudcover": 61.6,
      "sunrise": "05:45:46",
      "sunset": "20:29:24",
      "conditions": "Partially cloudy",
      "icon": "partly-cloudy-day",
      "stations": ["KIAD", "KJYO"],
      "hours": [
        {
          "datetime": "00:00:00",
          "temp": 52.9,
          "humidity": 59.3,
          "dew": 39.1,
          "windspeed": 5.3,
          "pressure": 1006.3,
          "cloudcover": 0.0,
          "conditions": "Clear",
          "icon": "clear-night"
        },
        {
          "datetime": "12:00:00",
          "temp": 65.8,
          "humidity": 43.1,
          "windspeed": 13.0,
          "pressure": 1010.5,
          "conditions": "Partially cloudy",
          "icon": "partly-cloudy-day"
        }
      ]
    },
    {
      "datetime": "2025-06-02",
      "tempmax": 74.0,
      "tempmin": 47.0,
      "temp": 61.7,
      "humidity": 53.5,
      "precip": 0.0,
      "windspeed": 10.0,
      "pressure": 1016.7,
      "cloudcover": 32.1,
      "sunrise": "05:45:24",
      "sunset": "20:30:04",
      "conditions": "Partially cloudy",
      "icon": "partly-cloudy-day"
    }
  ],

  "stations": {
    "KIAD": {
      "name": "Washington Dulles Intl AP",
      "latitude": 38.95,
      "longitude": -77.45,
      "distance": 8339.0
    },
    "KJYO": {
      "name": "Leesburg Executive Airport",
      "latitude": 39.08,
      "longitude": -77.56,
      "distance": 22247.0
    }
  }
}
```

The response begins with a set of properties that describe the location and request details. These include the requested location, the resolved address, the latitude and longitude, the time zone name, and the time zone offset in hours. Note that the time zone offset may vary within a dataset due to daylight saving time changes. When this occurs, a `tzoffset` property is included within the relevant `day`, `hour`, or `currentConditions` weather data object.

The JSON format represents weather data as a hierarchical structure of objects. It begins with an array of `days`, and each day may contain arrays of `hours` and `events` if those data sections are requested. When minute-level data is included, it appears within each `hour` object. For each time level (day, hour, minute, etc.), weather element values are provided as individual properties.

If the request includes the current date, the response will also contain the `currentConditions` object and any active weather alerts for the specified location.

#### FLAT JSON response format (beta)

*The flatjson format is currently beta and minor changes may occur. Please contact technical support for more information.*

```html
{
  "queryCost": 168,
  "latitude": 38.9598,
  "longitude": -77.3545,
  "resolvedAddress": "Reston, VA, United States",
  "address": "Reston,VA",
  "timezone": "America/New_York",
  "tzoffset": -4.0,
  "description": null,

  "days": {
    "datetime": ["2025-06-01", "2025-06-02"],
    "datetimeEpoch": [1748750400, 1748836800],
    "tempmax": [68.0, 74.0],
    "tempmin": [44.9, 47.0],
    "temp":    [58.6, 61.7],
    "humidity": [56, 54],
    "precip":   [0.0, 0.0],
    "precipprob": [0, 0],
    "windgust": [26.0, 19.7],
    "windspeed": [14.4, 10.0],
    "winddir": [258, 299],
    "pressure": [1010, 1017],
    "cloudcover": [62, 32],
    "visibility": [9.9, 9.9],
    "sunrise": ["05:45:46", "05:45:24"],
    "sunriseEpoch": [1748771146, 1748857524],
    "sunset": ["20:29:24", "20:30:04"],
    "sunsetEpoch": [1748824164, 1748910604],
    "conditions": [0, 0],
    "description": [0, 1],
    "icon": [0, 0],
    "preciptype": [null, null],
    "stations": [
      ["72405503714", "KIAD", "USW00093738", "C3816", "72403093738", "KJYO"],
      ["72405503714", "KIAD", "USW00093738", "C3816", "72403093738", "KJYO", "72033493764"]
    ]
  },

  "hours": {
    "datetime": ["2025-06-01T00", "2025-06-01T01"],
    "datetimeEpoch": [1748750400, 1748754000],
    "temp": [52.9, 50.0],
    "feelslike": [52.9, 50.0],
    "humidity": [59, 66],
    "dew": [39.1, 39.1],
    "precip": [0.0, 0.0],
    "precipprob": [0, 0],
    "windgust": [21.7, 19.7],
    "windspeed": [5.3, 0.9],
    "winddir": [331, 265],
    "pressure": [1006, 1006],
    "visibility": [9.9, 9.9],
    "cloudcover": [0, 0],
    "solarradiation": [0, 0],
    "solarenergy": [0.0, 0.0],
    "uvindex": [0, 0],
    "preciptype": [null, null],
    "conditions": [2, 2],
    "icon": [3, 3],
    "stations": [
      ["72405503714", "KIAD", "USW00093738", "C3816", "72403093738", "KJYO"],
      ["72405503714", "KIAD", "USW00093738", "C3816", "72403093738", "KJYO"]
    ]
  },

  "dictionaries": {
    "conditions": ["Partially cloudy", "Rain, Partially cloudy", "Clear", "Overcast", "Rain, Overcast"],
    "description": ["Partly cloudy throughout the day.", "Becoming cloudy in the afternoon.", "Partly cloudy with morning rain.", "Clear conditions throughout the day.", "Partly cloudy with rain."],
    "icon": ["partly-cloudy-day", "rain", "clear-day", "clear-night", "partly-cloudy-night", "cloudy"]
  }
}
```

Like JSON format, the response begins with top-level request and location metadata:

- address (requested location text)
- resolvedAddress (resolved location label)
- latitude and longitude
- timezone (IANA time zone)
- tzoffset (UTC offset in hours)

**Time zone behavior**  
The top-level tzoffset is the default offset for the response period. If daylight saving time or another offset transition occurs within the returned data, a tzoffset value is included on the affected day, hour, minute, or currentConditions record.  
Client rule: use the record-level tzoffset when present; otherwise use the top-level tzoffset.

**Columnar structure**  
FlatJSON is a columnar format, not an array of day or hour objects.

- days, hours, and minutes are objects
- each weather element is an array within that object
- arrays are parallel by index
- each index represents one time step

**Example**  
days.datetime index i, days.tempmax index i, and days.humidity index i all describe the same day.

**Aggressive null pruning**  
To keep payloads as small as possible, FlatJSON removes fields that contain only null values in a section.

- If every value for a field is null, that field may be omitted entirely
- Omitted fields should be interpreted as no available non-null values, not as zero or false
- Clients must check field existence before reading array values

**Example**  
If no returned day has a preciptype value, the days preciptype field may be absent.

**Dictionary-coded string fields**  
To reduce repeated string values, selected fields use integer codes plus lookup tables in dictionaries.  
Common dictionary-backed fields include:

- conditions
- description
- icon

**Decoding rule**  
If a field value is numeric (for example, days conditions index i equals 2), resolve it using the matching dictionary array index (dictionaries conditions index 2).

**Client parsing checklist**

1. Treat section fields as optional and sparse.
2. Validate field existence before indexing.
3. Align values by shared index only within the same section.
4. Decode coded fields using dictionaries when present.
5. Prefer per-record tzoffset when available.

### Response Elements

#### Response weather data elements

**cloudcover** – how much of the sky is covered in cloud ranging from 0-100%

**conditions** – textual representation of the weather conditions. See [Weather Data Conditions](https://www.visualcrossing.com/resources/documentation/weather-api/weather-condition-fields/).

**description** – longer text descriptions suitable for displaying in weather displays. The descriptions combine the main features of the weather for the day such as precipitation or amount of cloud cover. Daily descriptions are provided for historical and forecast days. When the timeline request includes the model forecast period, a seven day outlook description is provided at the root response level.

**datetime** – ISO 8601 formatted date, time or datetime value indicating the date and time of the weather data in the local time zone of the requested location. See [Dates and Times in the Weather API](https://www.visualcrossing.com/resources/documentation/weather-api/date-and-times-in-the-weather-api/) for more information.

**datetimeEpoch** – number of seconds since 1st January 1970 in UTC time

**tzoffset** – the time zone offset in hours. This will only occur in the data object if it is different from the global time zone offset.

**dew** – dew point temperature

**feelslike** – what the temperature feels like accounting for heat index or wind chill. Daily values are average values (mean) for the day.

**feelslikemax** (day only) – maximum feels like temperature at the location.

**feelslikemin** (day only) – minimum feels like temperature at the location.

**hours** – array of hourly weather data objects. This is a child of each of the daily weather object when hours are selected.

**humidity** – relative humidity in %

**icon** – a fixed, machine readable summary that can be used to display an icon

**moonphase** – represents the fractional portion through the current moon lunation cycle ranging from 0 (the new moon) to 0.5 (the full moon) and back to 1 (the next new moon). See [How to include sunrise, sunset, moon phase, moonrise and moonset data into your API requests](https://www.visualcrossing.com/resources/documentation/weather-api/how-to-include-sunrise-sunset-and-moon-phase-data-into-your-api-requests/)

**normal** – array of normal weather data values – Each weather data normal is an array of three values representing, in order, the minimum value over the statistical period, the mean value, and the maximum value over the statistical period.

**offsetseconds** (hourly only) – time zone offset for this weather data object in seconds – This value may change for a location based on daylight saving time observation.

**precip** – the amount of liquid precipitation that fell or is predicted to fall in the period. This includes the liquid-equivalent amount of any frozen precipitation such as snow or ice.

**precipremote** – radar estimated precipitation amount. See [How to Include Weather Radar Data in Weather Datasets](https://www.visualcrossing.com/resources/documentation/weather-data/how-to-include-weather-radar-data-in-weather-datasets/) for more information.

**precipcover** (days only) – the proportion of hours where there was non-zero precipitation

**precipprob** (forecast only) – the likelihood of measurable precipitation ranging from 0% to 100%

**preciptype** – an array indicating the type(s) of precipitation expected or that occurred. Possible values include rain, snow, freezingrain and ice.

**reflectivity** – (minutes only) estimates of the radar-based reflectivity values indicating precipitation intensity. See [How to Include Weather Radar Data in Weather Datasets](https://www.visualcrossing.com/resources/documentation/weather-data/how-to-include-weather-radar-data-in-weather-datasets/) for more information.

**pressure** – the sea level atmospheric or barometric pressure in millibars (or hectopascals)

**snow** – the amount of snow that fell or is predicted to fall

**snowdepth** – the depth of snow on the ground

**source** – the type of weather data used for this weather object. – Values include historical observation (“obs”), forecast (“fcst”), historical forecast (“histfcst”) or statistical forecast (“stats”). If multiple types are used in the same day, “comb” is used. Today a combination of historical observations and forecast data.

**stations** (historical only) – the weather stations used when collecting an historical observation record

**sunrise** (day only) – The formatted time of the sunrise (For example “2022-05-23T05:50:40”). See [How to include sunrise, sunset, moon phase, moonrise and moonset data into your API requests](https://www.visualcrossing.com/resources/documentation/weather-api/how-to-include-sunrise-sunset-and-moon-phase-data-into-your-api-requests/)

**sunriseEpoch** – sunrise time specified as number of seconds since 1st January 1970 in UTC time

**sunset** – The formatted time of the sunset (For example “2022-05-23T20:22:29”). See [How to include sunrise, sunset, moon phase, moonrise and moonset data into your API requests](https://www.visualcrossing.com/resources/documentation/weather-api/how-to-include-sunrise-sunset-and-moon-phase-data-into-your-api-requests/)

**sunsetEpoch** – sunset time specified as number of seconds since 1st January 1970 in UTC time

**moonrise** (day only, optional) – The formatted time of the moonrise (For example “2022-05-23T02:38:10”). See [How to include sunrise, sunset, moon phase, moonrise and moonset data into your API requests](https://www.visualcrossing.com/resources/documentation/weather-api/how-to-include-sunrise-sunset-and-moon-phase-data-into-your-api-requests/)

**moonriseEpoch** (day only, optional) – moonrise time specified as number of seconds since 1st January 1970 in UTC time

**moonset** (day only, optional) – The formatted time of the moonset (For example “2022-05-23T13:40:07”)

**moonsetEpoch** (day only, optional) – moonset time specified as number of seconds since 1st January 1970 in UTC time

**civil, nautical, and astronomical twilight (day only, optional)** – The formatted local times for the start of morning twilight and end of evening twilight. Available elements include `civildawn`, `civildusk`, `nauticaldawn`, `nauticaldusk`, `astronomicdawn`, and `astronomicdusk`. See [Daylight, Civil, Nautical, and Astronomical Twilight](https://www.visualcrossing.com/resources/documentation/weather-data/daylight-civil-nautical-astronomical-twilight/).

**twilight epoch values (day only, optional)** – Twilight times specified as the number of seconds since January 1, 1970 in UTC. Available elements include `civildawnEpoch`, `civilduskEpoch`, `nauticaldawnEpoch`, `nauticalduskEpoch`, `astronomicdawnEpoch`, and `astronomicduskEpoch`. See [Daylight, Civil, Nautical, and Astronomical Twilight](https://www.visualcrossing.com/resources/documentation/weather-data/daylight-civil-nautical-astronomical-twilight/).

**temp** – temperature at the location. Daily values are average values (mean) for the day.

**tempmax** (day only) – maximum temperature at the location.

**tempmin** (day only) – minimum temperature at the location.

**uvindex** – a value between 0 and 10 indicating the level of ultra violet (UV) exposure for that hour or day. 10 represents high level of exposure, and 0 represents no exposure. The UV index is calculated based on amount of short wave solar radiation which in turn is a level the cloudiness, type of cloud, time of day, time of year and location altitude. Daily values represent the maximum value of the hourly values.

**uvindex2** (optional, 5 day forecast only) – an alternative UV index element that uses the algorithms and models used by the [US National Weather Service](https://www.cpc.ncep.noaa.gov/products/stratosphere/uv_index/uv_global.shtml). In order to maintain backwards compatibility, this UV index element is deployed as a new, optional element ‘uvindex2’ and may be requested using the elements parameter.

**visibility** – distance at which distant objects are visible

**winddir** – direction from which the wind is blowing

**windgust** – instantaneous wind speed at a location – May be empty if it is not significantly higher than the wind speed. Daily values are the maximum hourly value for the day.

**windspeed** – the sustained wind speed measured as the average windspeed that occurs during the preceding one to two minutes. Daily values are the maximum hourly value for the day.

**windspeedmax** (day only, optional)– maximum wind speed over the day.

**windspeedmean** (day only, optional ) – average (mean) wind speed over the day.

**windspeedmin** (day only, optional ) – minimum wind speed over the day.

**solarradiation** – (W/m <sup>2</sup>) the solar radiation power at the instantaneous moment of the observation (or forecast prediction). See the [full solar radiation data documentation](https://www.visualcrossing.com/resources/documentation/weather-data/how-to-obtain-solar-radiation-data/) and [Wind and Solar Energy](https://www.visualcrossing.com/resources/documentation/weather-api/energy-elements-in-the-timeline-weather-api/) pages.

**solarenergy** – (MJ /m <sup>2</sup> ) indicates the total energy from the sun that builds up over an hour or day. See the [full solar radiation data documentation](https://www.visualcrossing.com/resources/documentation/weather-data/how-to-obtain-solar-radiation-data/) and [Wind and Solar Energy](https://www.visualcrossing.com/resources/documentation/weather-api/energy-elements-in-the-timeline-weather-api/) pages.

**severerisk (forecast only)** – a value between 0 and 100 representing the risk of convective storms (e.g. thunderstorms, hail and tornadoes). Severe risk is a scaled measure that combines a variety of other fields such as the convective available potential energy (CAPE) and convective inhibition (CIN), predicted rain and wind. Typically, a severe risk value less than 30 indicates a low risk, between 30 and 70 a moderate risk and above 70 a high risk.

**cape (forecast only)** – convective available potential energy. This is a numbering indicating amount of energy available to produce thunderstorms. A higher values indicates a more unstable atmosphere capable of creating stronger storms. Values lower than 1000 J/kg indicate generally low instability, between 1000-2500 J/kg medium instability and 2500-4000 J/kg high instability. Values greater than 4000 J/kg indicating an extremely unstable atmosphere.

**cin (forecast only)** – convective inhibition. A number representing the level of atmospheric tendency to prevent instability and therefore prevent thunderstorms.

**degreedays** (day only) – optional elements indicating the number of degree days for this date. See the [degree days API](https://www.visualcrossing.com/resources/documentation/weather-api/degree-day-weather-api/) for more information on degree days. To turn degree days and degree day accumulation on, use the elements parameter. For example, elements=datetime,tempmax,tempmin,degreedays,accdegreedays.

To convert existing Dark Sky API parameters to the Timeline Weather API, see *[How to replace the Dark Sky API with the Timeline Weather API](https://www.visualcrossing.com/resources/blog/how-to-replace-the-dark-sky-api-using-the-visual-crossing-timeline-weather-api/)*.

##### Location and station elements

The following are available in the JSON response type to provide information about the requested location:

**queryCost** – The record cost of this query. See [what is a record](https://www.visualcrossing.com/resources/documentation/weather-data/what-exactly-is-a-weather-record/) for more information.

**latitude,longitude** – the latitude and longitude of the requested location. This is provided in decimal degrees.

**resolvedAddress** – if the requested location was made by address, the address that is found using our internal geocoding engine.

**address** – the requested location text from the request.

**timezone** – the timezone of the location. See [Date and Times in the Weather API](https://www.visualcrossing.com/resources/documentation/weather-api/date-and-times-in-the-weather-api/) for more information.

**tzoffset** – the timezone offset from UTC time for the first record of the data. This may change throughout the dataset if there is a daylight savings change during the requested date range.

**elevation (optional)** – the elevation of the requested location. This is an optional element requested by including the elements parameter: (see [Adding and Removing Elements](https://www.visualcrossing.com/resources/documentation/weather-data/adding-and-removing-elements-from-your-weather-query/)).

### HTTP Response Code and Error Handling

The API communicates error codes through the HTTP response code. In addition, the body the response will normally include additional error information indicating the cause of the error. The possible HTTP response status codes include:

200 OK – a successfully processed request

400 BAD\_REQUEST – The format of the API is incorrect or an invalid parameter or combination of parameters was supplied

401 UNAUTHORIZED – There is a problem with the API key, account or subscription. May also be returned if a feature is requested for which the account does not have access to.

404 NOT\_FOUND – The request cannot be matched to any valid API request endpoint structure.

429 TOO\_MANY\_REQUESTS – The account has exceeded their assigned limits. See [What is the cause of “Maximum concurrent jobs has been exceeded”, HTTP response 429](https://www.visualcrossing.com/resources/documentation/weather-api/what-is-the-cause-of-maximum-concurrent-jobs-has-been-exceeded-http-response-429/)

500 INTERNAL\_SERVER\_ERROR – A general error has occurred processing the request.

For general information on debugging API queries, please see: [How to debug problems when running weather API queries in code](https://www.visualcrossing.com/resources/documentation/weather-api/how-to-debug-problems-when-running-weather-api-queries-in-code/)

### Using the OpenAPI Description

The [OpenAPI Initiative](https://www.openapis.org/) standardizes the description of APIs such as the Visual Crossing Weather API. If you are using a tool that supports the OpenAPI standard or Swagger, you can more easily use our API by importing the the specification document below.

### Questions or need help?

Our [AI Code generato](https://www.visualcrossing.com/support/weather-api-ai-code-generator/) r provides real-time, 24×7 access to code generation and other questions related to the Weather API usage.

If you have a additional questions, please post on our [actively monitored forum](https://support.visualcrossing.com/hc/en-us/community/topics/360001293151-Weather) for the fastest replies. You can also contact us via our [support site](https://www.visualcrossing.com/support/)
