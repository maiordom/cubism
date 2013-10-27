(function( $, root, undefined ) {
    'use strict';

    var Cubism = function( el, options ) {
        this.init( el, options );
    }

    var bind = function( context, callback ) {
        return function() {
            return callback.apply( context, arguments );
        };
    };

    var defs = {
        size: 150,
        perspective: 400,
        bgOpacity: 0.9,
        prefixList: [ 'webkit', 'Moz', 'O', 'ms' ],
        style: { Transform: null, Perspective: null },
        colors: [ '#058DC7', '#50B432', '#ED561B', '#DDDF00', '#FF9655', '#FFF263' ],
        faceNames: {
            front:  { transform: '0, 0, 0, 0deg'   },
            bottom: { transform: '1, 0, 0, -90deg' },
            back:   { transform: '1, 0, 0, 180deg' },
            top:    { transform: '1, 0, 0, 90deg'  },
            left:   { transform: '0, 1, 0, -90deg' },
            right:  { transform: '0, 1, 0, 90deg'  }
        }
    };

    Cubism.prototype = {
        init: function( el, options ) {
            this.el = el;
            this.sets = [];

            $.extend( true, this, defs, options );

            this.bindEvents();
            this.setPrefix();
            this.createSetCub();
            this.normalize();
        },

        bindEvents: function() {
            this.el.on( 'mousedown', '.cubism-cub', bind( this, this.onStartRotate ) );
        },

        onStartRotate: function( e ) {
            var cub = this.findCub( e.target ),
                elOffset = cub.el.offset();

            cub.mouseOffset.x = e.pageX;
            cub.mouseOffset.y = e.pageY;
            cub.elOffset.x    = elOffset.left;
            cub.elOffset.y    = elOffset.top;

            cub.el.on( 'mousemove',  bind( this, this.onRotate ) );
            cub.el.on( 'mouseleave', bind( this, this.onStopRotate ) );
            cub.el.on( 'mouseup',    bind( this, this.onStopRotate ) );
        },

        onStopRotate: function( e ) {
            var cub = this.findCub( e.target );
            cub.el.off( 'mouseleave mousemove mouseup' );
        },

        onRotate: function( e ) {
            var cub  = this.findCub( e.target ),
                diffX = e.pageX - cub.mouseOffset.x,
                diffY = e.pageY - cub.mouseOffset.y, distance, staticDistance;

            if ( diffY > 0 ) {
                distance = cub.elOffset.y + this.size - e.pageY;
                staticDistance = cub.elOffset.y + this.size - cub.mouseOffset.y;
            } else {
                distance = e.pageY - cub.elOffset.y;
                staticDistance = cub.mouseOffset.y - cub.elOffset.y;
            }

            console.log( e.pageY, cub.elOffset.y, distance );
        },

        getCubFromTarget: function( target ) {
            var cub = $( target );

            if ( cub.hasClass( 'cubism-cub' ) ) {
                return cub[ 0 ];
            }

            return cub.closest( '.cubism-cub' )[ 0 ];
        },

        findCub: function( cub ) {
            var result;

            cub = this.getCubFromTarget( cub );

            this.sets.forEach( function( item, index ) {
                if ( item.el[ 0 ] === cub ) {
                    result = item;
                }
            });

            return result;
        },

        createSetCub: function() {
            var self = this, cub;
            this.el[ 0 ].style[ this.style.perspective ] = this.perspective + 'px';
            this.el.find( '*' ).each( function() {
                cub = self.createCub( $( this ) );
                self.sets.push( cub );
            });
        },

        normalize: function() {
            var z = 0, midPoint = this.sets.length / 2 + 1;

            for ( var i = 0, ilen = this.sets.length; i < ilen; i++  ) {
                z += i < midPoint ? 1 : -1;
                this.sets[ i ].el[ 0 ].style.zIndex = z;
            }
        },

        setPrefix: function() {
            for ( var i in this.style ) {
                this.style[ i.toLowerCase() ] = this.prefixProp( i );
            }
        },

        prefixProp: function( prop ) {
            var prefix, prefixed;

            if ( document.body.style[ prop.toLowerCase() ] ) {
                return prop.toLowerCase();
            }

            for ( var i = 0, ilen = this.prefixList.length; i < ilen; i++ ) {
                prefix = this.prefixList[ i ];
                prefixed = prefix + prop;
                if ( document.body.style[ prefixed ] !== undefined ) {
                    return prefixed;
                }
            }

            return false;
        },

        createCub: function( el ) {
            var self = this, cub;

            cub = this.getInitialCubData( el );

            setTimeout( function() {
                self.cubPosition( cub );
            }, 10 );

            return cub;
        },

        createSides: function( el ) {
            var sides = document.createDocumentFragment(), side, index = 0;

            for ( var i in this.faceNames ) {
                side = this.createSide( i, this.getColor( index++ ) );
                sides.appendChild( side );
            }

            el[ 0 ].classList.add( 'cubism-cub' );
            el[ 0 ].style.width = el[ 0 ].style.height = this.size + 'px';

            return sides;
        },

        getInitialCubData: function( el ) {
            var rotateData = el.data(),
                sides = this.createSides( el );

            el[ 0 ].appendChild( sides );

            return {
                el: el,
                rotate: {
                    x: rotateData.rotatex || 0,
                    y: rotateData.rotatey || 0,
                    z: rotateData.rotatez || 0
                },
                mouseOffset: { x: 0, y: 0 },
                elOffset: { x: 0, y: 0 }
            };
        },

        cubPosition: function( cub ) {
            cub.el[ 0 ].style[ this.style.transform ] = '' +
                'rotateX(' + cub.rotate.x + 'deg) ' +
                'rotateY(' + cub.rotate.y + 'deg) ' +
                'rotateZ(' + cub.rotate.z + 'deg)';
        },

        getColor: function( index ) {
            return this.colors[ index % this.colors.length ];
        },

        createSide: function( side, color ) {
            var el = document.createElement( 'div' ),
                props =  this.faceNames[ side ];

            el.className = 'cubism-side cubism-' + side;
            el.style.background = this.hexToRgb( color );
            el.innerHTML = props.text;
            el.style[ this.style.transform ] = 'rotate3d(' + props.transform + ') translate3d(0, 0, ' + ( this.size / 2 ) + 'px)';

            return el;
        },

        getTransform: function( deg ) {
            return 'translateZ(-' + ( this.size / 2 ) + 'px) rotateX("' + deg + 'deg)';
        },

        hexToRgb: function( hex ) {
            var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? 'rgba(' + [
                parseInt( result[ 1 ], 16 ),
                parseInt( result[ 2 ], 16 ),
                parseInt( result[ 3 ], 16 ),
                this.bgOpacity
            ].join( ',' ) + ')' : '';
        }
    };

    $.fn.Cubism = function( options ) {
        var item;
        $( this ).each( function() {
            item = $( this );
            if ( item.data( 'Cubism' ) ) {
                console.log( 'Cubism already init', this );
            } else {
                item.data( 'Cubism', new Cubism( item, options || {} ) );
            }
        });
    };
    
})( jQuery, window, undefined );