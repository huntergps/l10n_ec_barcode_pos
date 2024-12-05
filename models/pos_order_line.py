# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo import api, fields, models, _
from odoo.tools import float_compare, float_is_zero, format_date


class PosOrderLine(models.Model):
    _inherit = 'pos.order.line'


    def _prepare_tax_base_line_values(self):
        """ Convert pos order lines into dictionaries that would be used to compute taxes later.

        :param sign: An optional parameter to force the sign of amounts.
        :return: A list of python dictionaries (see '_prepare_base_line_for_taxes_computation' in account.tax).
        """
        base_line_vals_list = []
        for line in self:
            commercial_partner = self.order_id.partner_id.commercial_partner_id
            fiscal_position = self.order_id.fiscal_position_id
            line = line.with_company(self.order_id.company_id)
            account = line.product_id._get_product_accounts()['income'] or self.order_id.config_id.journal_id.default_account_id
            if not account:
                raise UserError(_(
                    "Please define income account for this product: '%(product)s' (id:%(id)d).",
                    product=line.product_id.name, id=line.product_id.id,
                ))

            if fiscal_position:
                account = fiscal_position.map_account(account)

            is_refund_order = line.order_id.amount_total < 0.0
            is_refund_line = line.qty * line.price_unit < 0

            product_name = line.product_id\
                .with_context(lang=line.order_id.partner_id.lang or self.env.user.lang)\
                .get_product_multiline_description_sale()

            base_line_vals_list.append(
                {
                    **self.env['account.tax']._prepare_base_line_for_taxes_computation(
                        line,
                        partner_id=commercial_partner,
                        currency_id=self.order_id.currency_id,
                        product_id=line.product_id,
                        tax_ids=line.tax_ids_after_fiscal_position,
                        price_unit=line.price_unit,
                        quantity=line.qty * (-1 if is_refund_order else 1),
                        discount=line.discount,
                        account_id=account,
                        is_refund=is_refund_line,
                        sign=1 if is_refund_order else -1,
                    ),
                    'uom_id': line.product_uom_id,
                    'name': product_name,
                }
            )
        # print("********    :",base_line_vals_list)
        return base_line_vals_list


    @api.depends('product_id')
    def _compute_product_uom_id(self):
        for line in self:
            print("*"*60)
            if not line.product_uom_id:
                print("No hay line.product_uom_id")
                line.product_uom_id = line.product_id.uom_id
            print(line.product_uom_id.name)
            print("*"*60)

    uom_ids_allowed = fields.Many2many('uom.uom', compute='_compute_uom_ids_allowed', string='UdM Permitidos')
    product_uom_id = fields.Many2one('uom.uom', string='Product UoM', readonly=False, related=False)

    @api.depends('product_id')
    def _compute_uom_ids_allowed(self):
        for line in self:
            if line.product_id:
                uom_records = line.product_id.sale_uom_ids
                if line.product_id.uom_id not in uom_records:
                    uom_records |= line.product_id.uom_id
                line.uom_ids_allowed = uom_records
            else:
                line.uom_ids_allowed = self.env['uom.uom']


    @api.onchange('product_id')
    def _compute_uom_ids_allowed_onchange(self):
        self._compute_uom_ids_allowed()



    @api.model
    def _load_pos_data_fields(self, config_id):
        params = super()._load_pos_data_fields(config_id)
        params += ['uom_ids_allowed','product_uom_id']
        return params
