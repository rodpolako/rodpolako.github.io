# Changes in this version:

## New features ##
* Update to make this a Progressive Web App.  This will allow you to "install" the app to your computer or phone and have it behave like any other application. This is especially useful in mobile devices when there isn't sufficient vertical space to show the application due to the browser elements such as the address bar and other menus.
* Update to the Lichess studies feature.  The link provided in the error message when an incorrect PAT is supplied will now take you to the Lichess token creation screen with the needed elements pre-selected and filled.
* The app will now automatically pause if the user clicks away to another tab/window or turns off the screen on mobile devices.  
* Renamed the Lichess button to "Library" and made Lichess studies one of the items in that library. Eventually this library area will house additional sources of data (including multiple Lichess studies). Aside from a minor UI change at this point, there is no difference in functionality.
* Thanks to PvtTwinkle for submitting this app's first [pull request](https://github.com/rodpolako/Chess-PGN-Trainer/issues/19) to add docker support.

## Bug fixes ##
* Fixed an issue with extra spacing between the annotation header and the content when working with Lichess studies with embedded commands.
* Fixed bug where the app would not allow you to move to next puzzle if the PGN had an invalid FEN.  In the event that an invalid FEN is used, the next button will automatically show and allow proceeding to the next puzzle.
* Fixed an issue with iOS devices on smaller displays where moving the pieces sometimes scrolled the page when using the app in PWA form (ie: installing the app to the home screen). If this is encountered, generally fully closing the app and relaunching will resolve the issue.
* Fixed an issue with the move indicator not always showing the correct value when dealing with null moves and other corner cases.

## Maintenance ##
* Minor code cleanup.
* Added additional error-handling functionality to the Lichess API feature.
* Documentation updates to the wiki.
* Made a change to the annotation panel where the panel will be disabled on small mobile displays due to insufficient space to properly render.
* Made a change to prevent selecting anything other than the annotation panel which sometimes occurred on iOS devices.
