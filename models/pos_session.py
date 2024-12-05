# -*- coding: utf-8 -*-

from odoo import api, fields, models, _

class PosSession(models.Model):
	_inherit = 'pos.session'

	@api.model
	def _load_pos_data_models(self, config_id):
		data = super()._load_pos_data_models(config_id)
		data += ['product.barcode']
		return data
