
import { ProductProduct } from "@point_of_sale/app/models/product_product";
// import { ProductTemplate } from "@point_of_sale/app/models/product_template";
import { patch } from "@web/core/utils/patch";

patch(ProductProduct.prototype, {

    get_price(pricelist, quantity, price_extra = 0, recurring = false, list_price = false) {
        if (recurring && !pricelist) {
            alert(
                _t(
                    "An error occurred when loading product prices. " +
                        "Make sure all pricelists are available in the POS."
                )
            );
        }

        const rules = !pricelist ? [] : this.cachedPricelistRules[pricelist?.id] || [];
        let price = (list_price || this.lst_price) + (price_extra || 0);
        const rule = rules.find((rule) => !rule.min_quantity || quantity >= rule.min_quantity);
        if (!rule) {
            return price;
        }

        if (rule.base === "pricelist") {
            if (rule.base_pricelist_id) {
                price = this.get_price(rule.base_pricelist_id, quantity, 0, true, list_price);
            }
        } else if (rule.base === "standard_price") {
            price = this.standard_price;
        }

        if (rule.compute_price === "fixed") {
            price = rule.fixed_price;
        } else if (rule.compute_price === "percentage") {
            price = price - price * (rule.percent_price / 100);
        } else {
            var price_limit = price;
            price -= price * (rule.price_discount / 100);
            if (rule.price_round) {
                price = roundPrecision(price, rule.price_round);
            }
            if (rule.price_surcharge) {
                price += rule.price_surcharge;
            }
            if (rule.price_min_margin) {
                price = Math.max(price, price_limit + rule.price_min_margin);
            }
            if (rule.price_max_margin) {
                price = Math.min(price, price_limit + rule.price_max_margin);
            }
        }
        // This return value has to be rounded with round_di before
        // being used further. Note that this cannot happen here,
        // because it would cause inconsistencies with the backend for
        // pricelist that have base == 'pricelist'.
        return price;
    }

  ,

  compute_price_uom(price, target_uom) {
      if (!price || !target_uom) {
          return price;
      }
      const fromUnit = this.uom_id;
      if (fromUnit.category_id.id !== target_uom.category_id.id) {
          return price;
      }
      if (fromUnit.id === target_uom.id) {
          return price;
      }
      let amount = price * fromUnit.factor;
      amount = amount / target_uom.factor;
      return amount;
  },


  get searchString() {
      const fields = ["display_name", "description_sale", "description", "default_code","product_barcodes"];
      return fields
          .map((field) => this[field] || "")
          .filter(Boolean)
          .join(" ");
  }
});
