# -*- coding: utf-8 -*-

from odoo import api, fields, models, _

class ProductInherit(models.Model):
    _inherit = 'product.product'


    @api.depends('barcode','product_barcode', 'product_tmpl_id.barcode',  'product_tmpl_id.product_barcode')
    def _get_multi_barcode_search_string(self):
        for rec in self:
            barcode_search_string = rec.name
            for r in rec.product_barcode:
                barcode_search_string += '|' + r.barcode
            for rc in rec.product_tmpl_id.product_barcode:
                barcode_search_string += '|' + rc.barcode
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
