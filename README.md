# Le Monde data visualization
A project to collect written data of articles from the French newspaper Le Monde and display trends interactively.

## Scrapper
The scrapper is written in python and usees urllib to access the html code of Le Monde's archive site: https://www.lemonde.fr/archives-du-monde/. Through some clever tricks, the program can find the titles, descriptions, hyperlinks etc from the HTML code. The data is then stored in an excel file, which can then be exploited for the data visualizationin javascript.

I scrapped data from 2022 only, as any more than a years worth data tends to increase latency of the datavisualization interface. however it is possible, given enough time, to scrape all articles from 1945 onwards. The program is intentionally slowed down to not get banned from the archive site (which probably limits requests from individual IPs for protection against ddos attacks).

## Vizualization

The vizualization alows to search for keywords in article titles and descriptions. The amount of times keywords have benn used for each day is then displayed with a histogram. Individual days can be selected to see what main keywords were at the time. Selecting a given day will also display a grid of that days cover photos.

## Sample Video 

![alt text]("Projet_LeMonde_Bouigeon_Demo_Video.mp4")