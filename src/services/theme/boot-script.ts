import { SETTINGS_STORAGE_KEY } from '../settings/keys';

/**
 * Inline script run before first paint: applies the saved theme and language to <html>
 * so there is no flash of the default theme. Must stay dependency-free.
 */
export const THEME_BOOT_SCRIPT = `(function(){try{
var s=(JSON.parse(localStorage.getItem(${JSON.stringify(SETTINGS_STORAGE_KEY)})||'{}').state)||{};
var t=s.theme||'auto';
if(t==='auto'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'midnight':'classic';}
document.documentElement.setAttribute('data-theme',t);
if(s.locale){document.documentElement.setAttribute('lang',s.locale);}
}catch(e){}})();`;
