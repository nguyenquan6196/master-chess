import { SETTINGS_STORAGE_KEY } from '../settings/keys';
import {
  APPEARANCE_PRESETS,
  computeAppearanceVars,
  DEFAULT_DARK_THEME,
  DEFAULT_LIGHT_THEME,
} from './appearance';

/**
 * Inline script run before first paint: applies the saved theme, appearance overrides
 * and language to <html> so there is no flash of the default theme. It embeds the
 * source of `computeAppearanceVars` (self-contained) and the preset tables.
 */
export const THEME_BOOT_SCRIPT = `(function(){try{
var s=(JSON.parse(localStorage.getItem(${JSON.stringify(SETTINGS_STORAGE_KEY)})||'{}').state)||{};
var t=s.theme||'auto';
if(t==='auto'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?${JSON.stringify(DEFAULT_DARK_THEME)}:${JSON.stringify(DEFAULT_LIGHT_THEME)};}
var r=document.documentElement;
r.setAttribute('data-theme',t);
if(s.locale){r.setAttribute('lang',s.locale);}
if(s.board){var v=(${computeAppearanceVars.toString()})(s,${JSON.stringify(APPEARANCE_PRESETS)});
for(var k in v){r.style.setProperty(k,v[k]);}}
}catch(e){}})();`;
