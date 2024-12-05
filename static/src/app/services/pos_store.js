import {
    formatFloat, roundDecimals as round_di,
    roundPrecision as round_pr,floatIsZero,
} from "@web/core/utils/numbers";

import { Component } from "@odoo/owl";
import { usePos } from "@point_of_sale/app/store/pos_hook";
// import { usePos } from "@point_of_sale/app/hooks/pos_hook";
const { DateTime } = luxon;
import { serializeDateTime } from "@web/core/l10n/dates";
import { Dialog } from "@web/core/dialog/dialog";
import { patch } from "@web/core/utils/patch";
// import { PosStore } from "@point_of_sale/app/services/pos_store";
import { PosStore } from "@point_of_sale/app/store/pos_store";


patch(PosStore.prototype, {



    async addLineToCurrentOrder(vals, opts = {}, configure = true) {
        const productTemplate = vals.product_tmpl_id;
        if (productTemplate && !vals.product_uom_id) {
            vals.product_uom_id = productTemplate.uom_id; // Agregar la unidad de medida al objeto `vals`
        }
        console.log(vals);
        const result = await super.addLineToCurrentOrder(vals, opts, configure);
        return result; // Devuelve el resultado de la función original
    },

    async deleteLineQuantity(){
        setTimeout(() => {
          let line = this.get_order().get_selected_orderline();
          this.get_order().removeOrderline(line);
      }, 300)
    },

    async increaseLineQuantity() {
        setTimeout(() => {
          if (this.get_order().get_selected_orderline()) {
            let line =  this.get_order().get_selected_orderline();
            let current_qty = line?.get_quantity() || 0.0;
            line.set_quantity(current_qty+1);
          }
      }, 300)
    },

    async decreaseLineQuantity() {
        setTimeout(() => {
          if (this.get_order().get_selected_orderline()) {
            let line =  this.get_order().get_selected_orderline();
            let current_qty = line?.get_quantity() || 0.0;
              if (current_qty>1)
              {
                line.set_quantity(current_qty-1);
              }
          }
      }, 300)
    },

    open_UnitSelection_popup(event) {
        setTimeout(() => {
            if (this.get_order().get_selected_orderline()) {
                var self = this;
                var current_orderline = self.get_order().get_selected_orderline();
                const product = current_orderline.get_product();
                let uom_ids = (current_orderline.uom_ids_allowed && current_orderline.uom_ids_allowed.length > 0)
                    ? current_orderline.uom_ids_allowed
                    : (product.sale_uom_ids && product.sale_uom_ids.length > 0)
                        ? product.sale_uom_ids
                        : [];
                const current_unit = current_orderline.get_unit();
                if (!uom_ids.includes(current_unit)) {
                    uom_ids = [...uom_ids, current_unit];
                }
                if (!uom_ids.includes(product.uom_id)) {
                    uom_ids = [...uom_ids, product.uom_id];
                }
                self.env.services.dialog.add(UnitSelectionUomPos, {
                      title: "Seleccione la Unidad de Medida",
                            list: uom_ids,
                            value: current_orderline.get_unit(),
                            orderline: current_orderline,
                        });
            }
        }, 300)
    },

    async processServerData() {
        await super.processServerData();
        this._loadProductBarcode(this.models['product.barcode'].getAll())
    },

    _loadProductBarcode(barcodes){
          var self=this;
          self.barcode_by_name={};
          barcodes.forEach(function (barcode){
              self.barcode_by_name[barcode.barcode] = barcode;
          });
    },
});


export class UnitSelectionUomPos extends Component {
    static template = "UnitSelectionUomPos";
    static components = { Dialog };

    setup() {
        super.setup();
        var self = this;
        // Validaciones para las props requeridas
        if (!self.props || !self.props.list || !self.props.orderline) {
            console.error("Props faltantes o mal configuradas:", self.props);
            throw new Error("Props requeridas no fueron proporcionadas para UnitSelectionUomPos");
        }
        self.uomList = self.props.list || [];
        self.pos = usePos();
        self.uomList.forEach(item => {
            if(self.props.value){
                if(item.id == self.props.value.id){
                    item.selected = true;
                }else{
                    item.selected = false;
                }
            }
            else{
                if(item.id == self.props.orderline.uom_id){
                    item.selected = true;
                }
                else{
                    item.selected = false;
                }
            }
        });
        // Unidad seleccionada por defecto
        const selectedItem = self.uomList.find(item => item.id === self.value);
        if (selectedItem) {
          self.selectedUomId = selectedItem.id
        }
        else {
          self.selectedUomId = self.props.value?.id || null;
        }
        if (selectedItem) {
            selectedItem.selected = true; // Mark the found item as selected
        }
        self.selectedItem =selectedItem
        this.selectUom = this.selectUom.bind(this);
        this.confirmSelection = this.confirmSelection.bind(this);
        this.cancelSelection = this.cancelSelection.bind(this);

    }

    selectUom(uom) {
        if (uom) {
            this.uomList.forEach((item) => (item.selected = item.id === uom.id));
            this.selectedUomId = uom.id;
            this.selectedItem=uom
            this.render(); // Renderizar cambios
        }
    }

    confirmSelection() {
        if (this.selectedUomId) {
            this.props.orderline.set_unit(this.selectedItem); // Actualizar el ID de la unidad
            this.props.close(); // Cerrar el diálogo

        } else {
            console.warn("No se seleccionó ninguna unidad de medida.");
        }
    }

    cancelSelection() {
        this.props.close(); // Cerrar el diálogo sin realizar cambios
    }
}
