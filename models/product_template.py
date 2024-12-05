# -*- coding: utf-8 -*-

from odoo import api, fields, models, _

class ProductTemplate(models.Model):
    _inherit = 'product.template'

    # Campo calculado que concatena el nombre del producto con sus códigos de barras relacionados
    @api.depends('barcode','product_barcode', 'product_variant_ids.barcode',  'product_variant_ids.product_barcode')
    def _get_multi_barcode_search_string(self):
        for rec in self:
            barcode_search_string = rec.name
            for r in rec.product_barcode:
                barcode_search_string += '|' + r.barcode
            rec.product_barcodes = barcode_search_string
        return barcode_search_string

    # Campo computado que almacena los códigos de barras concatenados
    product_barcodes = fields.Char(
        compute="_get_multi_barcode_search_string",
        string="Códigos de Barras",
        store=True,
    )


    @api.model
    def _load_pos_data_fields(self, config_id):
        params = super()._load_pos_data_fields(config_id)
        params += ['product_barcodes','sale_uom_ids']
        return params
