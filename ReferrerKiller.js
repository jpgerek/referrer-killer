/**
 * @Project: ReferrerKiller.
 * @Licence: The MIT License.
 * @Author: Juan Pablo Guereca.
 * @Description: Crossbrowser referrer killing solution.
 * 		It's a hack that prevents the browser of sending the http referrer in the following cases:
 * 			- Link: You can have a link in your website being sure that the destiny won't know about your site.
 * 			- Image: You can display an image from another site being sure the other site won't know your website is displaying it.
 * 	Other interesting use is displaying an image without blocking the rest of the content, this way in case the image fails
 * it allows the rest of the page to load normally.
 * 		Uses:
 * 			- Load static content in parallel.
 * 			- Provide privacy to your web users.
 * 			- Saving bandwidth, considering you safe the extra bytes of the http referrer.
 * 		Abuses:
 * 			- Stilling bandwidth, using some other site contents (hotlinking, http://en.wikipedia.org/wiki/Inline_linking).
 * @Compatibility:
 * 		It's been tested successfully on:
 * 			- Chrome 24.
 * 			- Firefox 15.
 * 			- Safari 6.
 * 			- Opera 12: it sends the referrer in the case of anchors if the target is an iframe, not if it opens in other window
 * 				or the same one, for images it never sends the referrer even without using the hack.
 * 			- IE 6, 7, 8.
 * 			- IE 9: it works for images but not links, that's why in that oogle's url redirection is used for this browser, in this case
 * 					there is an intermediate page.
 * @Interface:
 * 		- ReferrerKiller.linkHtml(url, [innerHtml], [anchorParams], [iframeAttributes]). Returns a string.
 * 		- ReferrerKiller.linkNode(url, [innerHtml], [anchorParams], [iframeAttributes]). Returns an Html Node.
 * 		- ReferrerKiller.imageHtml(url, [imgParams], [iframeAttributes]). Returns a string.
 * 		- ReferrerKiller.imageNode(url, [imgParams], [iframeAttributes]). Returns an Html Node.
 */

/**
 * @module ReferrerKiller
 */
var ReferrerKiller = (function () {
	var URL_REDIRECTION = "https://www.google.com/url?q=", // You can use another service if you use https protocol no referrer will be sent.
		PUB = {},
		IE_GT_8 = (function () {
				/*- Detecting if it's IE greater than 8 -*/
				var trident,
					match = navigator.userAgent.match(/Trident\/(\d)+/);
				if (null === match) {
					return false;
				}
				trident = parseInt(match[1], 10);
				if (isNaN(trident)) {
					return false;
				}
				return trident > 4;
		})();

	/**
	 * Escapes double quotes in a string.
	 *
	 * @private
	 * @param {string} str
	 * @return {string}
	 */
	function escapeDoubleQuotes(str) {
		return str.split('"').join('\\"');
	}
	
	/**
	 * Given a html string returns an html node.
	 *
	 * @private
	 * @param {string} html
	 * @return {Node}
	 */
	function htmlToNode(html) {
		var container = document.createElement('div');
		container.innerHTML = html;
		return container.firstChild;
	}
	
	/**
	 * Converts object to html attributes string.
	 *
	 * @private
	 * @param {object} obj
	 * @return {string}
	 */
	function objectToHtmlAttributes(obj) {
		var attributes = [],
			value;
		for (var name in obj) {
			value = obj[name];
			attributes.push(name + '="' + escapeDoubleQuotes(value) + '"');
		}
		return attributes.join(' ');
	}

	/**
	 * It applies the hack to kill the referrer to some html.
	 *
	 * @public
	 * @param {string} html.
	 * @param {object} [iframeAttributes]
	 * @return {string} html.
	 */
	function htmlString(html, iframeAttributes) {
		var iframeAttributes  = iframeAttributes || {},
			defaultStyles = 'border:none; overflow:hidden; ',
			id;
		/*-- Setting default styles and letting the option to add more or overwrite them --*/
		if ('style' in iframeAttributes) {
			iframeAttributes.style =  defaultStyles + iframeAttributes.style;
		} else {
			iframeAttributes.style = defaultStyles;
		}
		id = '__referrer_killer_' + (new Date).getTime() + Math.floor(Math.random()*9999);
		/*-- Returning html with the hack wrapper --*/
		return '<iframe \
				style="border 1px solid #ff0000" \
				scrolling="no" \
				frameborder="no" \
				allowtransparency="true" ' +
			/*-- Adding style attribute --*/
			objectToHtmlAttributes( iframeAttributes ) +
			'id="' + id + '" ' +
			'	src="javascript:\'\
			<!doctype html>\
			<html>\
			<head>\
			<meta charset=\\\'utf-8\\\'>\
			<style>*{margin:0;padding:0;border:0;}</style>\
			</head>' +
			/*-- Function to adapt iframe's size to content's size --*/
			'<script>\
				 function resizeWindow() {\
					var elems  = document.getElementsByTagName(\\\'*\\\'),\
						width  = 0,\
						height = 0,\
						first  = document.body.firstChild,\
						elem;\
					if (first.offsetHeight && first.offsetWidth) {\
						width = first.offsetWidth;\
						height = first.offsetHeight;\
					} else {\
						for (var i in elems) {\
											elem = elems[i];\
											if (!elem.offsetWidth) {\
												continue;\
											}\
											width  = Math.max(elem.offsetWidth, width);\
											height = Math.max(elem.offsetHeight, height);\
						}\
					}\
					var ifr = parent.document.getElementById(\\\'' + id + '\\\');\
					ifr.height = height;\
					ifr.width  = width;\
				}\
			</script>' +
			'<body onload=\\\'resizeWindow()\\\'>\' + decodeURIComponent(\'' +
			/*-- Content --*/
			encodeURIComponent(html) +
		'\') +\'</body></html>\'"></iframe>';
	}

	/*-- Public interface --*/

	/**
	 * It creates a link without referrer.
	 *
	 * @public
	 * @param {string} url
	 * @param {string} innerHTML
	 * @param {object} [anchorParams]
	 * @param {object} [iframeAttributes]
	 * @return {string} html
	 */
	function linkHtml(url, innerHTML, anchorParams, iframeAttributes) {
		var html,
			urlRedirection = '';
		innerHTML = innerHTML || false;
		/*-- If there is no innerHTML use the url as innerHTML --*/
		if (!innerHTML) {
			innerHTML = url;
		}
		anchorParams = anchorParams || {};
		/*-- Making sure there is a target attribute and the value isn't '_self' --*/
		if (!('target' in anchorParams) || '_self' === anchorParams.target) {
			/*-- Converting _self to _top else it would open in the iframe container --*/
			anchorParams.target = '_top';
		}
		if (IE_GT_8) {
			urlRedirection = URL_REDIRECTION;
		}
		html = '<a rel="noreferrer" href="' + urlRedirection + escapeDoubleQuotes(url) + '" ' + objectToHtmlAttributes(anchorParams) + '>' + innerHTML + '</a>';
		return htmlString(html, iframeAttributes);
	}
	PUB.linkHtml = linkHtml;
	
	/**
	 * It creates a link without referrer.
	 *
	 * @public
	 * @param {String} url
	 * @param {String} innerHTML
	 * @param {Object} [anchorParams]
	 * @param {object} [iframeAttributes]
	 * @return {Node}
	 */
	function linkNode(url, innerHTML, anchorParams, iframeAttributes) {
		return htmlToNode(linkHtml(url, innerHTML, anchorParams, iframeAttributes));
	}
	PUB.linkNode = linkNode;
	
	/**
	 * It displays an image without sending the referrer.
	 *
	 * @public
	 * @param {String} url
	 * @param {Object} [imgAttributesParam]
	 * @return {String} html
	 */
	function imageHtml(url, imgAttributesParam) {
		var imgAttributes = imgAttributesParam || {},
		/*-- Making sure this styles are applyed in the image but let the possibility to overwrite them --*/
			defaultStyles = 'border:none; margin: 0; padding: 0';
		if ('style' in imgAttributes) {
			imgAttributes.style = defaultStyles + imgAttributes.style;
		} else {
			imgAttributes.style = defaultStyles;
		}
		return htmlString('<img src="' + escapeDoubleQuotes(url) + '" ' + objectToHtmlAttributes(imgAttributes) + '/>');
	}
	PUB.imageHtml = imageHtml;
	
	/**
	 * It displays an image without sending the referrer.
	 *
	 * @public
	 * @param {string} url
	 * @param {object} [imgParams]
	 * @return {Node}
	 */
	function imageNode(url, imgParams) {
		return htmlToNode(imageHtml(url, imgParams));
	}
	PUB.imageNode = imageNode;

	/*-- Exposing the module interface --*/
	return PUB;
})();
