{
    'name': 'Ecuadorian Localization Multiple Barcode for products on POS',
    'version': '18.01',
    'summary': 'Customization module for Ecuadorian localization to use multiples Barcodes in products on POS',
    'description': """
    Este módulo permite usar barios codigos de barras y precios por cada UdM en Punto de Venta.
    """,
    'icon': '/account/static/description/l10n.png',
    'countries': ['ec'],
    'author': 'Elmer Salazar Arias',
    'category': 'Accounting/Localizations/',
    'maintainer': 'Elmer Salazar Arias',
    'website': 'http://www.galapagos.tech',
    'email': 'esalazargps@gmail.com',
    'license': 'LGPL-3',
    'depends': [
        'l10n_ec_base',
        'sale',
        'purchase',
        'point_of_sale',
        'l10n_ec_barcode_products'
    ],
    'data': [
        'security/ir.model.access.csv',
    ],
    'assets': {
        'point_of_sale._assets_pos': [
            'l10n_ec_barcode_pos/static/src/**/*',
            # "l10n_ec_barcode_pos/static/src/app/css/popups/unit_selection_popup.css"
        ],
    },
    'demo': [],
    'installable': True,
    'application': True,
    'auto_install': False,
}
