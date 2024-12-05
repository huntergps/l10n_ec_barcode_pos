# -*- coding: UTF-8 -*-
# Part of Softhealer Technologies.


from odoo import api, fields, models


class SaleOrderLine(models.Model):
    _inherit = ['sale.order.line']
