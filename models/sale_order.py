# -*- coding: utf-8 -*-
# Part of BrowseInfo. See LICENSE file for full copyright and licensing details.

from odoo import models, _
from odoo.addons.sale_stock.models.sale_order import SaleOrder


class sale_order(models.Model):
    _inherit = 'sale.order'
