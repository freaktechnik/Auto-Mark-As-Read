# Auto Mark as Read

## Description
A Jetpack based Firefox extension, which automatically marks articles in your feedly cloud as read, when you read them on their website.
When a page is recognized as unread article, it will be marked as read in feedly after a certain amount of time was spent on the page, or when the page has been scrolled to the bottom.

The recognition for articles supports:

   * Ignoring tracking parameters for article matching
   * Articles in the reader on Firefox for Android
   * Resolving feedproxy.google.com redirects from Feedburner feeds
   * Using canonical URLs if possible

After the article has been marked as read, a notification will be shown with an option to keep the article unread.

## License
Licensed under the [MPL-2](http://mozilla.org/MPL/2.0/) license.

## Credits
Created 2015 by Martin Giger.

URL expansion by [LongURL](http://longurl.org).

## Building instructions
This should be buildable with jpm without any further requirements.
