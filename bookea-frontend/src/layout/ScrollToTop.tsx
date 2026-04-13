import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

function scrollElementToTop(el: Element | null) {
	if (!(el instanceof HTMLElement)) return;
	el.scrollTop = 0;
	el.scrollLeft = 0;
	el.scrollTo(0, 0);
}

/**
 * Resets scroll on client-side route changes. With `html, body { height: 100% }`
 * (see index.html), the scrollable region is often `documentElement` / `body`,
 * not `window`, so we reset every plausible scroll root.
 */
function scrollAppToTop() {
	window.scrollTo(0, 0);

	const docEl = document.documentElement;
	const body = document.body;
	docEl.scrollTop = 0;
	docEl.scrollLeft = 0;
	body.scrollTop = 0;
	body.scrollLeft = 0;
	docEl.scrollTo(0, 0);
	body.scrollTo(0, 0);

	const scrolling = document.scrollingElement;
	if (scrolling) {
		scrolling.scrollTop = 0;
		scrolling.scrollLeft = 0;
		scrolling.scrollTo(0, 0);
	}

	scrollElementToTop(document.getElementById('root'));
	scrollElementToTop(document.querySelector('.app-container'));
	scrollElementToTop(document.querySelector('.main-content'));
}

export function ScrollToTop() {
	const { pathname } = useLocation();

	useEffect(() => {
		scrollAppToTop();
		requestAnimationFrame(() => {
			scrollAppToTop();
		});
	}, [pathname]);

	return null;
}
