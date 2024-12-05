
import { patch } from "@web/core/utils/patch";
import { _t } from "@web/core/l10n/translation";
import { PosOrderline } from "@point_of_sale/app/models/pos_order_line";

import { constructFullProductName, uuidv4 } from "@point_of_sale/utils";
import { Base } from "@point_of_sale/app/models/related_models";
import { parseFloat } from "@web/views/fields/parsers";
import { formatFloat, roundDecimals, roundPrecision, floatIsZero } from "@web/core/utils/numbers";
import { roundCurrency, formatCurrency } from "@point_of_sale/app/models/utils/currency";

import {
    getTaxesAfterFiscalPosition,
    getTaxesValues,
} from "@point_of_sale/app/models/utils/tax_utils";



patch(PosOrderline.prototype, {


  set_quantity(quantity, keep_price) {
      this.order_id.assert_editable();
      const quant =
          typeof quantity === "number" ? quantity : parseFloat("" + (quantity ? quantity : 0));

      const allLineToRefundUuids = this.models["pos.order"].reduce((acc, order) => {
          Object.assign(acc, order.uiState.lineToRefund);
          return acc;
      }, {});

      if (this.refunded_orderline_id?.uuid in allLineToRefundUuids) {
          const refundDetails = allLineToRefundUuids[this.refunded_orderline_id.uuid];
          const maxQtyToRefund = refundDetails.line.qty - refundDetails.line.refunded_qty;
          if (quant > 0) {
              return {
                  title: _t("Positive quantity not allowed"),
                  body: _t(
                      "Only a negative quantity is allowed for this refund line. Click on +/- to modify the quantity to be refunded."
                  ),
              };
          } else if (quant == 0) {
              refundDetails.qty = 0;
          } else if (-quant <= maxQtyToRefund) {
              refundDetails.qty = -quant;
          } else {
              return {
                  title: _t("Greater than allowed"),
                  body: _t(
                      "The requested quantity to be refunded is higher than the refundable quantity."
                  ),
              };
          }
      }
      // const unit = this.product_id.uom_id;
      const unit = this.product_uom_id || this.product_id.uom_id;
      if (unit) {
          if (unit.rounding) {
              const decimals = this.models["decimal.precision"].find(
                  (dp) => dp.name === "Product Unit of Measure"
              ).digits;
              const rounding = Math.max(unit.rounding, Math.pow(10, -decimals));
              this.qty = roundPrecision(quant, rounding);
          } else {
              this.qty = roundPrecision(quant, 1);
          }
      } else {
          this.qty = quant;
      }

      // just like in sale.order changing the qty will recompute the unit price
      if (!keep_price && this.price_type === "original") {
          this.set_unit_price(
              this.product_id.get_price(
                  this.order_id.pricelist_id,
                  this.get_quantity(),
                  this.get_price_extra()
              )
          );
      }

      this.setDirty();
      return true;
  }
,

  set_quantity1(quantity, keep_price) {
      this.order_id.assert_editable();
      const quant =
          typeof quantity === "number" ? quantity : parseFloat("" + (quantity ? quantity : 0));

      const allLineToRefundUuids = this.models["pos.order"].reduce((acc, order) => {
          Object.assign(acc, order.uiState.lineToRefund);
          return acc;
      }, {});

      if (this.refunded_orderline_id?.uuid in allLineToRefundUuids) {
          const refundDetails = allLineToRefundUuids[this.refunded_orderline_id.uuid];
          const maxQtyToRefund = refundDetails.line.qty - refundDetails.line.refunded_qty;
          if (quant > 0) {
              return {
                  title: _t("Positive quantity not allowed"),
                  body: _t(
                      "Only a negative quantity is allowed for this refund line. Click on +/- to modify the quantity to be refunded."
                  ),
              };
          } else if (quant == 0) {
              refundDetails.qty = 0;
          } else if (-quant <= maxQtyToRefund) {
              refundDetails.qty = -quant;
          } else {
              return {
                  title: _t("Greater than allowed"),
                  body: _t(
                      "The requested quantity to be refunded is higher than the refundable quantity."
                  ),
              };
          }
      }
      const unit = this.product_uom_id || this.product_id.uom_id;
      // const unit = this.product_uom_id;
      console.log("unit    >>> ",unit);
      if (unit) {
          if (unit.rounding) {
              const decimals = this.models["decimal.precision"].find(
                  (dp) => dp.name === "Product Unit of Measure"
              ).digits;
              const rounding = Math.max(unit.rounding, Math.pow(10, -decimals));
              this.qty = roundPrecision(quant, rounding);
          } else {
              this.qty = roundPrecision(quant, 1);
          }
      } else {
          this.qty = quant;
      }
      console.log("keep_price = ",keep_price, "   this.price_type = ",this.price_type);
      // just like in sale.order changing the qty will recompute the unit price
      if (!keep_price && this.price_type === "original") {
          // const productTemplate = this.product_id.product_tmpl_id;
          const productTemplate = this.product_id;
          let order_line_price =productTemplate.get_price(
              this.order_id.pricelist_id,
              this.get_quantity(),
              this.get_price_extra(),
              false,
              this.product_id
              );
              console.log("PASoo!!!!!!");
          let priceUom = productTemplate.compute_price_uom(order_line_price, unit);
          console.log("PASoo2222!!!!!!");
          console.log(priceUom);
          this.set_unit_price(priceUom);
      }

      this.setDirty();
      return true;
  }
,
  get_quantity_str_with_unit() {
      const unit = this.product_uom_id || this.product_id.uom_id;
      if (this.is_pos_groupable()) {
          return this.quantityStr + " " + unit.name;
      } else {
          return this.quantityStr;
      }
  }
,

get_lst_price() {
    let order_line_price = this.product_id.get_price(
        this.config.pricelist_id,
        1,
        this.price_extra,
        false,
        this.product_id
    );
    let priceUom = this.product_id.compute_price_uom(order_line_price, this.get_unit());
    return priceUom
},
getDisplayData() {

    return {
        productName: this.get_full_product_name(),
        price: this.getPriceString(),
        qty: this.get_quantity_str(),
        unit: this.product_uom_id ? this.product_uom_id.name : "",
        unitPrice: formatCurrency(this.get_unit_display_price(), this.currency),
        oldUnitPrice: this.get_old_unit_display_price()
            ? formatCurrency(this.get_old_unit_display_price(), this.currency)
            : "",
        discount: this.get_discount_str(),
        customerNote: this.get_customer_note() || "",
        internalNote: this.getNote(),
        comboParent: this.combo_parent_id?.get_full_product_name?.() || "",
        packLotLines: this.pack_lot_ids.map(
            (l) =>
                `${l.pos_order_line_id.product_id.tracking == "lot" ? "Lot Number" : "SN"} ${
                    l.lot_name
                }`
        ),
        price_without_discount: formatCurrency(
            this.getUnitDisplayPriceBeforeDiscount(),
            this.currency
        ),
        taxGroupLabels: [
            ...new Set(
                this.product_id.taxes_id
                    ?.map((tax) => tax.tax_group_id.pos_receipt_label)
                    .filter((label) => label)
            ),
        ].join(" "),
    };
},

get_unit() {
    return this.product_uom_id || this.product_id.uom_id;
},

set_unit(unit) {
    if (unit) {
        console.log(unit);
        this.product_uom_id = unit; //Actualiza la unidad seleccionada
        const order = this.order_id;
        console.log("PASoo3333!!!!!!");
        // const product = this.get_product();
        const product = this.get_product();
        console.log("PASoo4444444!!!!!!");
        console.log('  order.pricelist_id : ',  order.pricelist_id);
        let order_line_price = product.get_price(
            order.pricelist_id,
            this.get_quantity(),
            0,
        );
        console.log(order_line_price);
        console.log("PASoo555555!!!!!!");

        let priceUom = product.compute_price_uom(order_line_price, unit);
        console.log("PASoo66666!!!!!!");
        console.log(priceUom);
        this.set_unit_price(priceUom);

        this.setDirty(); // Marca el estado como modificado

    }
},


});
