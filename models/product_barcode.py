# -*- coding: utf-8 -*-

from odoo import api, fields, models, tools, _



class ProductBarcode(models.Model):
	_inherit = 'product.barcode'

	@api.model
	def _load_pos_data_domain(self, data):
		return []


	@api.model
	def _load_pos_data_fields(self, config_id):
		return ['product_id','barcode','product_tmpl_id','company_id','uom_name','uom_ids_allowed']


	def _load_pos_data(self, data):
		domain = []
		fields = self._load_pos_data_fields(data['pos.config']['data'][0]['id'])
		data = self.search_read(domain, fields, load=False)
		return {
			'data': data,
			'fields': fields
		}
