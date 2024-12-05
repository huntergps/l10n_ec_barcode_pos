
import { patch } from "@web/core/utils/patch";
import { fuzzyLookup } from "@web/core/utils/search";
import { unaccent } from "@web/core/utils/strings";
import { ProductScreen } from "@point_of_sale/app/screens/product_screen/product_screen";


patch(ProductScreen.prototype, {

    setup() {
        super.setup(...arguments);
    },

    async _barcodeProductAction(code) {
        let prod;
        let barcode = this.pos.barcode_by_name[code.base_code];
        if (barcode){
            if (barcode.product_id){
                await this.pos.addLineToCurrentOrder(
                    { product_id: barcode.product_id },
                    { code },
                    barcode.product_id.needToConfigure()
                );
        this.numberBuffer.reset();
            }
        }else{
            await super._barcodeProductAction(code);
        }

    },


    getProductsBySearchWord(searchWord) {
        return optimizedSearch(
            unaccent(searchWord, false),
            this.products,
            (product) => unaccent(product.searchString, false)
        );
    },

});



function optimizedSearch(pattern, list, fn) {
    if (!pattern || !list || list.length === 0) {
        return []; // Maneja entradas vacías
    }

    let exactMatch = null;
    const fuzzyResults = [];
    for (const data of list) {
        const value = fn(data);
        // Prioriza coincidencias exactas
        if (value === pattern) {
            exactMatch = [data];
            break; // Detenemos la búsqueda al encontrar coincidencia exacta
        }
        // Aplicamos lógica fuzzy
        const score = match(pattern, value);
        if (score > 0) {
            fuzzyResults.push({ score, elem: data });
        }
    }
    if (exactMatch) {
        return exactMatch; // Devuelve coincidencia exacta
    }
    let optimized_fuzzyResults = [];
    if (fuzzyResults.length > 1) {
        // Procesa fuzzyResults con _match_mejorada
        optimized_fuzzyResults = fuzzyResults
            .map(({ elem }) => ({
                elem,
                score: _match_mejorada(pattern, fn(elem)),
            }))
            .filter(({ score }) => score > 0); // Filtra los resultados relevantes
    }
    if (optimized_fuzzyResults.length > 0) {
        // Ordena por puntuación y devuelve los elementos optimizados
        return optimized_fuzzyResults
            .sort((a, b) => b.score - a.score)
            .map((r) => r.elem);
    }

    // Ordena los resultados fuzzy por puntuación y devuelve los elementos
    return fuzzyResults
        .sort((a, b) => b.score - a.score)
        .map((r) => r.elem);
}



function match(pattern, strs) {
    if (!Array.isArray(strs)) {
        strs = [strs];
    }
    let globalScore = 0;
    for (const str of strs) {
        globalScore = Math.max(globalScore, _match(pattern, str));
    }
    return globalScore;
}



function _match(pattern, str) {
    if (!pattern || !str) return 0; // Maneja entradas vacías o inválidas

    let totalScore = 0;
    let currentScore = 0;
    const len = str.length;
    let patternIndex = 0;

    pattern = unaccent(pattern, false);
    str = unaccent(str, false);

    for (let i = 0; i < len; i++) {
        if (str[i] === pattern[patternIndex]) {
            patternIndex++;
            currentScore += 100 + currentScore - i / 200;
        } else {
            currentScore = 0;
        }
        totalScore += currentScore;
    }

    // Verifica si el patrón completo fue encontrado
    return patternIndex === pattern.length ? totalScore : 0;
}



function _match_mejorada(pattern, value) {
    // Esta función asegura coincidencias más estrictas basadas en subcadenas continuas
    const index = value.indexOf(pattern);
    if (index === -1) {
        return 0; // No hay coincidencia continua
    }
    // Prioriza coincidencias exactas y cercanas al inicio
    return 1000 - index * 10 + pattern.length * 100; // Mayor puntuación para coincidencias al inicio
}
