DotLedger.module('Views.Accounts', function () {
  this.BalanceGraph = Backbone.Marionette.ItemView.extend({
    tagName: 'div',

    template: 'accounts/balance_graph',

    initialize: function (options) {
      this.balances = new DotLedger.Collections.Balances();
      this.params = options.params;
    },

    events: {
      'click a[data-period]': 'clickPeriod'
    },

    setActivePeriod: function () {
      this.$el.find('a[data-period]').parent().removeClass('active');
      this.$el.find("a[data-period='" + (this.params.get('period')) + "']").parent().addClass('active');
    },

    clickPeriod: function (event) {
      event.preventDefault();
      this.params.set({
        period: $(event.target).data('period')
      });
      this.setActivePeriod();
      this.fetchBalances();
    },

    fetchBalances: function () {
      var dateFrom, dateTo;
      dateTo = moment();

      switch (this.params.get('period')) {
        case 'mtd':
          dateFrom = moment().startOf('month');
          break;
        case 'ytd':
          dateFrom = moment().startOf('year');
          break;
        default:
          dateFrom = moment().subtract(this.params.get('period'), 'days');
      }

      this.balances.fetch({
        data: {
          account_id: this.model.id,
          date_from: DotLedger.Helpers.Format.queryDate(dateFrom),
          date_to: DotLedger.Helpers.Format.queryDate(dateTo)
        }
      });
    },

    ui: {
      balanceGraph: '.balance .graph',
      balanceTooltip: '.balance .tooltip',
      balanceTooltipInner: '.balance .tooltip .tooltip-inner'
    },

    balanceGraphData: function () {
      return [
        {
          color: 'rgb(111, 202, 194)',
          data: this.balances.map(function (balance) {
            return [DotLedger.Helpers.Format.unixMilliTimestamp(balance.get('date')), balance.get('balance')];
          })
        }
      ];
    },

    balanceGraphOptions: function () {
      return {
        series: {
          shadowSize: 1,
          lines: {
            show: true,
            lineWidth: 2,
            fill: true,
            fillColor: 'rgba(111, 202, 194, 0.6)'
          }
        },
        grid: {
          borderWidth: 0,
          hoverable: true
        },
        points: {
          radius: 2
        },
        xaxis: {
          mode: 'time',
          timeformat: '%e %b',
          tickLength: 0
        },
        yaxis: {
          tickColor: 'rgba(238, 238, 238, 1)'
        }
      };
    },

    renderBalanceGraph: function () {
      this.setActivePeriod();
      if (this.isRendered) {
        this.graph = $.plot(this.ui.balanceGraph, this.balanceGraphData(), this.balanceGraphOptions());
        this.ui.balanceGraph.bind('plothover', _.bind(function (event, pos, item) {
          var balance;
          if (item) {
            balance = DotLedger.Helpers.Format.money(item.datapoint[1]);
            this.ui.balanceTooltipInner.html(balance);
            this.ui.balanceTooltip.css({
              top: item.pageY - 35,
              left: item.pageX - 40
            }).addClass('in');
          } else {
            this.ui.balanceTooltip.removeClass('in');
          }
        }, this));
      }
    },

    onRender: function () {
      this.balances.on('sync', _.bind(function () {
        this.renderBalanceGraph();
      }, this));

      this.fetchBalances();
      _.defer(_.bind(function () {
        this.renderBalanceGraph();
      }, this));
    }
  });
});
