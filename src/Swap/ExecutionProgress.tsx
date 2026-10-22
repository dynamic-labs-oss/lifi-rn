import Svg, { Path } from "react-native-svg";
import { getExplorerUrl } from "./utils";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface ExecutionProgressItem {
  stepIndex: number;
  stepType: string;
  status: string;
  txHash?: string;
  explorerLink?: string;
  chainId?: number;
  message: string;
}

interface ExecutionProgressProps {
  executionProgress: ExecutionProgressItem[];
}

const styles = StyleSheet.create({
  spinner: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: "yellow",
    borderTopColor: "transparent",
    borderRadius: 10,
    animation: "spin 1s linear infinite",
  },
  statusIcon: {
    width: 20,
    height: 20,
    color: "green",
  },
  container: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 16,
  },
  progressContainer: {
    gap: 16,
  },
  progressItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  progressItemContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  progressItemHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  progressItemHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  progressItemStep: {
    fontSize: 14,
    fontWeight: "bold",
  },
  progressItemStepType: {
    fontSize: 12,
    color: "gray",
  },
  progressItemMessage: {
    fontSize: 12,
    color: "gray",
  },
  progressItemTxHash: {
    fontSize: 12,
    color: "gray",
  },
  progressItemTxHashContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  progressItemTxHashLabel: {
    fontSize: 12,
    color: "gray",
  },
});

export const ExecutionProgress = ({
  executionProgress,
}: ExecutionProgressProps) => {
  if (executionProgress.length === 0) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DONE":
        return "bg-green-100 text-green-800 border-green-200";
      case "FAILED":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "DONE":
        return (
          <Svg
            style={styles.statusIcon}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <Path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </Svg>
        );
      case "FAILED":
        return (
          <Svg
            style={styles.statusIcon}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <Path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </Svg>
        );
      default:
        return <View style={styles.spinner} />;
    }
  };

  return (
    <>
      <View style={styles.container}>
        <Text style={styles.title}>Execution Progress</Text>
        <View style={styles.statusIcon}>
          <Svg
            style={styles.statusIcon}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <Path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </Svg>
        </View>
        <Text style={styles.title}>Execution Progress</Text>
      </View>

      <View style={styles.progressContainer}>
        {executionProgress.map((progress, index) => {
          const explorerUrl =
            progress.explorerLink ||
            getExplorerUrl(progress.txHash!, progress.chainId);

          return (
            <View key={index} style={styles.progressItem}>
              <View style={styles.progressItemContent}>
                <View style={styles.statusIcon}>
                  {getStatusIcon(progress.status)}
                </View>

                <View style={styles.progressItem}>
                  <View style={styles.progressItemHeader}>
                    <View style={styles.progressItemHeaderContent}>
                      <Text style={styles.progressItemStep}>
                        Step {progress.stepIndex + 1}
                      </Text>
                      <Text style={styles.progressItemStepType}>
                        {progress.stepType}
                      </Text>
                    </View>

                    <Text
                      className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                        progress.status,
                      )}`}
                    >
                      {progress.status}
                    </Text>
                  </View>

                  <Text style={styles.progressItemMessage}>
                    {progress.message}
                  </Text>

                  {progress.txHash && (
                    <View style={styles.progressItemTxHash}>
                      <View style={styles.progressItemTxHashContent}>
                        <Text style={styles.progressItemTxHashLabel}>
                          Transaction Hash:
                        </Text>
                        {explorerUrl ? (
                          <TouchableOpacity
                            href={explorerUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-sm bg-gray-100 px-2 py-1 rounded border hover:bg-gray-200 transition-colors cursor-pointer text-blue-600 hover:text-blue-800"
                          >
                            {progress.txHash.slice(0, 10)}...
                            {progress.txHash.slice(-8)}
                          </TouchableOpacity>
                        ) : (
                          <Text style={styles.progressItemTxHash}>
                            {progress.txHash.slice(0, 10)}...
                            {progress.txHash.slice(-8)}
                          </Text>
                        )}
                      </View>

                      {progress.explorerLink && (
                        <TouchableOpacity
                          href={progress.explorerLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                        >
                          <Svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <Path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                            />
                          </Svg>
                          <Text>View on Explorer</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </>
  );
};
