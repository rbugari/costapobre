// costapobre/frontend/src/services/adService.js

const isProduction = import.meta.env.VITE_APP_ENV === 'production';
const adSenseClient = import.meta.env.VITE_ADSENSE_CLIENT_ID;

/**
 * Muestra un anuncio recompensado.
 * En desarrollo, simula el flujo.
 * En producción, muestra un anuncio real de AdSense.
 * @returns {Promise<{adWatched: boolean}>} - Resuelve con true si el anuncio fue visto, de lo contrario false.
 */
export function showRewardedAd() {
    if (isProduction) {
        return showRealRewardedAd();
    } else {
        return showMockRewardedAd();
    }
}

/**
 * Simula un anuncio recompensado para desarrollo.
 */
function showMockRewardedAd() {
    console.log("AD_SERVICE (DEV): Mostrando anuncio simulado.");
    return new Promise((resolve) => {
        if (confirm("Estás en modo DESARROLLO.\n\n¿Simular que has visto un anuncio recompensado para obtener el beneficio?")) {
            // Simular la duración del anuncio
            setTimeout(() => {
                console.log("AD_SERVICE (DEV): Anuncio 'visto'. Recompensa otorgada.");
                resolve({ adWatched: true });
            }, 1500); // Simula 1.5 segundos de espera
        } else {
            console.log("AD_SERVICE (DEV): Anuncio 'cerrado'. Sin recompensa.");
            resolve({ adWatched: false });
        }
    });
}

/**
 * Muestra un anuncio recompensado real de Google AdSense.
 */
function showRealRewardedAd() {
    console.log("AD_SERVICE (PROD): Solicitando anuncio real de AdSense.");
    return new Promise((resolve) => {
        window.adsbygoogle = window.adsbygoogle || [];

        // This is a placeholder for actual rewarded ad display logic.
        // In a real scenario, you would typically use a specific ad unit
        // and listen for events like 'rewarded_ad_finished'.
        window.adsbygoogle.push({
            google_ad_client: adSenseClient,
            enable_page_level_ads: true,
            page_level_ads: {
                rewarded_ad: true
            }
        });

        // Simulate ad playing duration
        console.log("AD_SERVICE (PROD): Simulando reproducción de anuncio (espera de 15 segundos).");
        setTimeout(() => {
            console.log("AD_SERVICE (PROD): Anuncio simulado 'visto'. Recompensa otorgada.");
            resolve({ adWatched: true });
        }, 15000); // Simulate 15 seconds of ad playback
    });
}

/**
 * Muestra un anuncio no recompensado (intersticial).
 * En desarrollo, simula el flujo.
 * En producción, muestra un anuncio real de AdSense.
 */
export function showNonRewardedAd() {
    if (isProduction) {
        showRealNonRewardedAd();
    } else {
        showMockNonRewardedAd();
    }
}

/**
 * Simula un anuncio no recompensado para desarrollo.
 */
function showMockNonRewardedAd() {
    console.log("AD_SERVICE (DEV): Mostrando anuncio no recompensado simulado.");
    alert("Estás en modo DESARROLLO.\n\nImagina que acabas de ver un anuncio no recompensado (intersticial).");
}

/**
 * Muestra un anuncio no recompensado real de Google AdSense.
 */
function showRealNonRewardedAd() {
    console.log("AD_SERVICE (PROD): Mostrando anuncio no recompensado real de AdSense.");
    window.adsbygoogle = window.adsbygoogle || [];
    window.adsbygoogle.push({
        google_ad_client: adSenseClient,
        enable_page_level_ads: true,
        page_level_ads: {
            interstitial: {
                ad_slot: "2860472138"
            }
        }
    });
}
