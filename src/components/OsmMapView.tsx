import React, { useRef, useImperativeHandle, forwardRef, useEffect } from 'react';
import { View, StyleProp, ViewStyle } from 'react-native';
import { WebView } from 'react-native-webview';

export type Coordinate = { latitude: number; longitude: number };
export type MarkerProps = { coordinate: Coordinate; title?: string; pinColor?: string };
export type PolylineProps = { coordinates: Coordinate[]; strokeColor?: string; strokeWidth?: number };
export type Region = { latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number };

export interface OsmMapViewProps {
  style?: StyleProp<ViewStyle>;
  region?: Region;
  initialRegion?: Region;
  markers?: MarkerProps[];
  polylines?: PolylineProps[];
  fitToCoordinates?: Coordinate[];
  scrollEnabled?: boolean;
  zoomEnabled?: boolean;
  onLayout?: () => void;
}

export const OsmMapView = forwardRef((props: OsmMapViewProps, ref) => {
  const webviewRef = useRef<WebView>(null);
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        body, html { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; }
        #map { width: 100%; height: 100%; touch-action: none; }
        .leaflet-control-attribution { display: none; }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map = L.map('map', {
          zoomControl: false,
          dragging: ${props.scrollEnabled !== false},
          touchZoom: ${props.zoomEnabled !== false},
          scrollWheelZoom: ${props.zoomEnabled !== false},
          doubleClickZoom: ${props.zoomEnabled !== false},
          maxZoom: 15,
          minZoom: 8
        });

        // Use free public OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 15,
          minZoom: 8
        }).addTo(map);

        var markersLayer = L.layerGroup().addTo(map);
        var polylineLayer = L.layerGroup().addTo(map);

        // Initialize view
        var currentRegion = ${JSON.stringify(props.region || props.initialRegion || null)};
        if (currentRegion) {
           map.setView([currentRegion.latitude, currentRegion.longitude], 14);
        } else {
           map.setView([0, 0], 2);
        }

        // Expose a function to update data from React Native
        window.updateMapData = function(data) {
          try {
            var parsed = JSON.parse(data);
            
            if (parsed.region) {
              map.setView([parsed.region.latitude, parsed.region.longitude], 15);
            }

            if (parsed.markers !== undefined) {
              markersLayer.clearLayers();
              parsed.markers.forEach(function(m) {
                var color = m.pinColor === 'green' ? '#28a745' : (m.pinColor === 'red' ? '#dc3545' : '#007bff');
                var marker = L.circleMarker([m.coordinate.latitude, m.coordinate.longitude], {
                  color: '#fff',
                  weight: 2,
                  fillColor: color,
                  fillOpacity: 1,
                  radius: 8
                }).addTo(markersLayer);
                if (m.title) {
                  marker.bindPopup(m.title);
                }
              });
            }

            if (parsed.polylines !== undefined) {
              polylineLayer.clearLayers();
              parsed.polylines.forEach(function(p) {
                var latlngs = p.coordinates.map(function(c) { return [c.latitude, c.longitude]; });
                L.polyline(latlngs, {
                  color: p.strokeColor || '#007bff',
                  weight: p.strokeWidth || 4,
                  opacity: 0.8
                }).addTo(polylineLayer);
              });
            }
            
            if (parsed.fitToCoordinates && parsed.fitToCoordinates.length > 0) {
               var latlngs = parsed.fitToCoordinates.map(function(c) { return [c.latitude, c.longitude]; });
               var bounds = L.latLngBounds(latlngs);
               if (bounds.isValid()) {
                 map.fitBounds(bounds, { padding: [20, 20], maxZoom: 15 });
               }
            }
          } catch(e) {
            console.error(e);
          }
        };

        // Emit loaded event
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'loaded' }));
      </script>
    </body>
    </html>
  `;

  useImperativeHandle(ref, () => ({
    fitToCoordinates: (coords: Coordinate[], options: any) => {
      if (webviewRef.current) {
        webviewRef.current.injectJavaScript(`
          if (window.updateMapData) {
            window.updateMapData(JSON.stringify({ fitToCoordinates: ${JSON.stringify(coords)} }));
          }
          true;
        `);
      }
    }
  }));

  useEffect(() => {
    if (webviewRef.current) {
      const data = {
        region: props.region,
        markers: props.markers,
        polylines: props.polylines,
        fitToCoordinates: props.fitToCoordinates
      };
      webviewRef.current.injectJavaScript(`
        if (window.updateMapData) {
          window.updateMapData(JSON.stringify(${JSON.stringify(data)}));
        }
        true;
      `);
    }
  }, [props.region, props.markers, props.polylines]);

  return (
    <View style={props.style} onLayout={props.onLayout}>
      <WebView
        ref={webviewRef}
        source={{ html: htmlContent }}
        style={{ flex: 1, backgroundColor: 'transparent' }}
        scrollEnabled={props.scrollEnabled !== false}
        nestedScrollEnabled={true}
        setBuiltInZoomControls={false}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        javaScriptEnabled={true}
        onMessage={(event) => {
           try {
             const data = JSON.parse(event.nativeEvent.data);
             if (data.type === 'loaded') {
               // trigger initial data inject
               if (webviewRef.current) {
                 const initData = {
                   region: props.region || props.initialRegion,
                   markers: props.markers,
                   polylines: props.polylines,
                   fitToCoordinates: props.fitToCoordinates
                 };
                 webviewRef.current.injectJavaScript(`
                   if (window.updateMapData) {
                     window.updateMapData(JSON.stringify(${JSON.stringify(initData)}));
                   }
                   true;
                 `);
               }
             }
           } catch (e) {}
        }}
      />
    </View>
  );
});
