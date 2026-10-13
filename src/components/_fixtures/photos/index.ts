/**
 * STORY FIXTURE — real photographs from the SSB landing page, for the marketing
 * stories. Not part of the public API, not shipped (`tsconfig.build.json`
 * excludes `_fixtures`), not scanned for classes. Where each file came from,
 * and its credit, is in `README.md` beside it.
 *
 * `new URL('./file', import.meta.url)` is the stories' asset pattern (Card's
 * stand-ins): Vite copies the file into the Storybook build and hands back
 * its URL, so nothing here needs a module declaration for images. Each path
 * is a literal: a template would make Vite glob the whole folder.
 */

/* Scenes */

/** Students walking the campus path under SSB's banners: a deep scene with a bright sky (1600 x 900). */
export const CAMPUS_WALK = new URL('./campus-walk.webp', import.meta.url).href;
/** The school's entrance, bright and pale: white type needs the dark plate here (1280 x 720). */
export const CAMPUS_ENTRANCE = new URL('./campus-entrance.webp', import.meta.url).href;
/** Scaler's Innovation Lab, empty: glass rooms under a white ceiling, no faces (1400 x 843). */
export const INNOVATION_LAB = new URL('./innovation-lab.webp', import.meta.url).href;
/** The Golden Gate from Battery Spencer, CC0: the immersions' Silicon Valley card (1280 x 960). */
export const SAN_FRANCISCO = new URL('./san-francisco.webp', import.meta.url).href;
/** Anupam Mittal's campus visit, the testimonial band's still: him on the left, a dim room (1600 x 686). */
export const MITTAL_VISIT = new URL('./mittal-visit.webp', import.meta.url).href;
/** Ankur Warikoo at the convocation, the testimonial band's pale still: a white tent (980 x 720). */
export const WARIKOO_CONVOCATION = new URL('./warikoo-convocation.webp', import.meta.url).href;
/** A live project's card art: a laptop with a price chart and a coffee, dark, 3:4 (900 x 1200). */
export const LIVE_PROJECT = new URL('./live-project.jpg', import.meta.url).href;

/* People: the school's own faculty and alumni, as the page shows them */

/** Malthi SS, faculty (Ex-Product Director, PayPal): 4:5 portrait, face high and centred (640 x 800). */
export const MALTHI_SS = new URL('./malthi-ss.webp', import.meta.url).href;
/** Gaurav Dadhich, faculty (Founder; ex-Flipkart, Razorpay, Amazon): 4:5 portrait (640 x 800). */
export const GAURAV_DADHICH = new URL('./gaurav-dadhich.webp', import.meta.url).href;
/** Sidhant Goyal, faculty and investor (Toddle; Ex-Sequoia Capital): 4:5 portrait (640 x 800). */
export const SIDHANT_GOYAL = new URL('./sidhant-goyal.webp', import.meta.url).href;
/** Moh Agarwal, alumna (Growth Marketing, BharatPe): 3:2, her on the left, a dark blur to the right (948 x 631). */
export const MOH_AGARWAL = new URL('./moh-agarwal.webp', import.meta.url).href;
/** Aashish US's face, cropped square from the alumni photo, for a 32px avatar (192 x 192). */
export const AASHISH_US_AVATAR = new URL('./aashish-us-avatar.webp', import.meta.url).href;
/** Tanisha Singhal, a student creator (tech events & resources): cropped below her hairline so her face sits in the top third (702 x 580). */
export const TANISHA_SINGHAL = new URL('./tanisha-singhal.webp', import.meta.url).href;
