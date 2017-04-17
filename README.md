# referrer-killer

Crossbrowser referrer killing solution.

It's a hack that prevents the browser from sending the http referrer in the following cases:
 * Link: You can have a link in your website being sure that the destiny won't know about your site.
 * Image: You can display an image from another site being sure the other site won't know your website is displaying it.
 
Other interesting use is displaying an image without blocking the rest of the content, this way in case the image fails it allows the rest of the page to load normally. Notice modern browsers don't block anymore.

Uses:
 * Load static content in parallel.
 * Provide privacy to your web users.
 * Saving bandwidth, considering you save the extra bytes of the http referrer.

Abuses:
 * Stealing bandwidth, using some other site contents (hotlinking, http://en.wikipedia.org/wiki/Inline_linking).
