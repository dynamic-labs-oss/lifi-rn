import { Route } from "@lifi/sdk";
import { formatAmount } from "./utils";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import Svg, { Path } from "react-native-svg";

interface RouteDisplayProps {
  routes: Route[];
  selectedRoute: Route | null;
  toTokenSymbol?: string;
  onRouteSelect: (route: Route) => void;
}

const CheckIcon = () => (
  <Svg style={styles.checkIcon} fill="currentColor" viewBox="0 0 20 20">
    <Path
      fillRule="evenodd"
      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
      clipRule="evenodd"
    />
  </Svg>
);

export default function RouteDisplay({
  routes,
  selectedRoute,
  toTokenSymbol,
  onRouteSelect,
}: RouteDisplayProps) {
  if (routes.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Available Routes ({routes.length})</Text>

      <View style={styles.routesContainer}>
        {routes.map((route, index) => {
          const isSelected = selectedRoute?.id === route.id;
          const estimatedTime = Math.ceil(
            route.steps.reduce(
              (acc, step) => acc + (step.estimate.executionDuration || 0),
              0,
            ) / 60,
          );

          return (
            <TouchableOpacity
              key={route.id}
              onPress={() => onRouteSelect(route)}
              style={[
                styles.routeCard,
                isSelected ? styles.selectedRoute : styles.unselectedRoute,
              ]}
            >
              <View style={styles.routeHeader}>
                <View style={styles.routeInfo}>
                  <View
                    style={[
                      styles.routeNumber,
                      isSelected
                        ? styles.selectedRouteNumber
                        : styles.unselectedRouteNumber,
                    ]}
                  >
                    <Text style={styles.routeNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.routeTitle}>Route {index + 1}</Text>
                </View>

                <View style={styles.routeMeta}>
                  <View style={styles.timeBadge}>
                    <Text style={styles.timeText}>~{estimatedTime} min</Text>
                  </View>
                  {isSelected && (
                    <View style={styles.checkBadge}>
                      <CheckIcon />
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.routeDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>You get:</Text>
                  <Text style={styles.detailValue}>
                    {formatAmount(route.toAmount, route.toToken.decimals)}{" "}
                    {toTokenSymbol || route.toToken.symbol}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Steps:</Text>
                  <Text style={styles.detailValue}>
                    {route.steps.length} step{route.steps.length > 1 ? "s" : ""}{" "}
                    via {route.steps.map((step) => step.tool).join(" → ")}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Gas cost:</Text>
                  <Text style={styles.detailValue}>
                    ~${route.gasCostUSD || "N/A"}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 8,
    padding: 24,
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 24,
  },
  routesContainer: {
    gap: 16,
  },
  routeCard: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    minHeight: 44,
  },
  selectedRoute: {
    borderColor: "#3B82F6",
    backgroundColor: "#EFF6FF",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 8,
  },
  unselectedRoute: {
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
  },
  routeHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  routeInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  routeNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedRouteNumber: {
    backgroundColor: "#3B82F6",
  },
  unselectedRouteNumber: {
    backgroundColor: "#E5E7EB",
  },
  routeNumberText: {
    fontWeight: "bold",
    fontSize: 14,
    color: "white",
  },
  routeTitle: {
    fontWeight: "500",
    color: "#111827",
    fontSize: 16,
  },
  routeMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  timeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: "#F3F4F6",
    borderRadius: 16,
  },
  timeText: {
    fontSize: 14,
    color: "#4B5563",
  },
  checkBadge: {
    width: 20,
    height: 20,
    backgroundColor: "#3B82F6",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  checkIcon: {
    width: 12,
    height: 12,
    color: "white",
  },
  routeDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  detailLabel: {
    fontSize: 14,
    color: "#4B5563",
  },
  detailValue: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "500",
    textAlign: "right",
    flex: 1,
    marginLeft: 8,
  },
});
