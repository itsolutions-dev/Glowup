import React, { useState } from "react";
import { ScrollView, View, StyleSheet, SafeAreaView } from "react-native";
import { useTheme } from "../providers/ThemeProvider";

// Components
import Typography from "../components/Typography";
import Button from "../components/Button";
import Input from "../components/Input";
import Select from "../components/Select";
import Checkbox from "../components/Checkbox";
import Toggle from "../components/Toggle";
import Chip from "../components/Chip";
import Badge from "../components/Badge";
import IconBadge from "../components/IconBadge";
import StatusBadge from "../components/StatusBadge";
import Avatar from "../components/Avatar";
import Card from "../components/Card";
import Paper from "../components/Paper";
import Divider from "../components/Divider";
import Accordion from "../components/Accordion";
import Tabs from "../components/Tab/Tabs";
import FAB from "../components/FAB";
import Spinner from "../components/Spinner";
import NumericInput from "../components/NumericInput";
import DateTimePicker from "../components/DateTimePicker";
import LinearProgress from "../components/Progress/LinearProgress";
import CircularProgress from "../components/Progress/CircularProgress";
import Modal from "../components/Modal/Modal";
import ConfirmDialog from "../components/Modal/ConfirmDialog";
import Snackbar from "../components/Snackbar";
import ToggleButtonGroup from "../components/ToggleButton/ToogleButtonGroup";
import AppBar from "../components/AppBar";
import Stepper from "../components/Stepper";
import DataGrid, { ColumnDefinition } from "../components/DataGrid";

import ListItem from "../components/List/ListItem";

import Popover from "../components/Popover";

import SpeedDial from "../components/SpeedDial";

const Playground = () => {
  const { theme, toggleTheme } = useTheme();

  // State for interactive components
  const [inputValue, setInputValue] = useState("");
  const [selectValue, setSelectValue] = useState("opt1");
  const [checkboxValue, setCheckboxValue] = useState(false);
  const [toggleValue, setToggleValue] = useState(false);
  const [numericValue, setNumericValue] = useState("10");
  const [spinnerValue, setSpinnerValue] = useState(10);
  const [dateValue, setDateValue] = useState(new Date());
  const [activeTab, setActiveTab] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [toggleGroupValue, setToggleGroupValue] = useState("left");
  const [activeStep, setActiveStep] = useState(1);

  // DataGrid State
  const [gridDensity, setGridDensity] = useState<"normal" | "dense">("normal");
  const [gridData, setGridData] = useState([
    {
      id: 1,
      name: "Alice Johnson",
      email: "alice@example.com",
      role: "Admin",
      status: "Active",
    },
    {
      id: 2,
      name: "Bob Smith",
      email: "bob@example.com",
      role: "User",
      status: "Inactive",
    },
    {
      id: 3,
      name: "Charlie Brown",
      email: "charlie@example.com",
      role: "Editor",
      status: "Active",
    },
    {
      id: 4,
      name: "Diana Prince",
      email: "diana@example.com",
      role: "Admin",
      status: "Active",
    },
    {
      id: 5,
      name: "Edward Norton",
      email: "edward@example.com",
      role: "User",
      status: "Active",
    },
    {
      id: 6,
      name: "Fiona Apple",
      email: "fiona@example.com",
      role: "User",
      status: "Inactive",
    },
    {
      id: 7,
      name: "George Clooney",
      email: "george@example.com",
      role: "Editor",
      status: "Active",
    },
    {
      id: 8,
      name: "Hannah Abbott",
      email: "hannah@example.com",
      role: "User",
      status: "Active",
    },
    {
      id: 9,
      name: "Ian McKellen",
      email: "ian@example.com",
      role: "Admin",
      status: "Active",
    },
    {
      id: 10,
      name: "Jane Doe",
      email: "jane@example.com",
      role: "User",
      status: "Active",
    },
  ]);
  const [gridColumns, setGridColumns] = useState<ColumnDefinition[]>([
    { id: "name", label: "Name", width: 180, sortable: true },
    { id: "email", label: "Email", width: 220, sortable: true },
    { id: "role", label: "Role", width: 120, sortable: true },
    { id: "status", label: "Status", width: 100, sortable: true },
  ]);
  const [sortCol, setSortCol] = useState<string>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [gridLoading, setGridLoading] = useState(false);

  const handleSort = (columnId: string, direction: "asc" | "desc") => {
    setSortCol(columnId);
    setSortDir(direction);

    const sortedData = [...gridData].sort((a, b) => {
      const valA = a[columnId];
      const valB = b[columnId];
      if (valA < valB) return direction === "asc" ? -1 : 1;
      if (valA > valB) return direction === "asc" ? 1 : -1;
      return 0;
    });
    setGridData(sortedData);
  };

  const loadMoreGridData = () => {
    if (gridLoading) return;
    setGridLoading(true);
    // Simulate API call
    setTimeout(() => {
      const newItems = Array.from({ length: 10 }).map((_, i) => ({
        id: gridData.length + i + 1,
        name: `User ${gridData.length + i + 1}`,
        email: `user${gridData.length + i + 1}@example.com`,
        role: i % 2 === 0 ? "User" : "Editor",
        status: "Active",
      }));
      setGridData([...gridData, ...newItems]);
      setGridLoading(false);
    }, 1500);
  };

  const Section = ({
    title,
    children,
  }: {
    title: string;
    children: React.ReactNode;
  }) => (
    <View style={styles.section}>
      <Typography variant="titleLarge" style={styles.sectionTitle}>
        {title}
      </Typography>
      <Divider style={styles.divider} />
      {children}
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
    >
      <AppBar
        navigation={{ openDrawer: () => {}, goBack: () => {} } as any}
        route={{ name: "Playground" } as any}
        back={false}
        options={
          {
            headerTitle: "Component Playground",
            headerRight: () => (
              <View style={{ marginRight: 8 }}>
                <Button
                  onPress={toggleTheme}
                  mode="tonal"
                  iconName={theme.isDark ? "brightness-7" : "brightness-4"}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    padding: 0,
                  }}
                >
                  {""}
                </Button>
              </View>
            ),
          } as any
        }
      />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Section title="Typography">
          <Typography variant="displayLarge">Display Large</Typography>
          <Typography variant="headlineMedium">Headline Medium</Typography>
          <Typography variant="titleLarge">Title Large</Typography>
          <Typography variant="titleMedium">
            Title Medium (Body Substitute)
          </Typography>
          <Typography variant="labelSmall">Label Small</Typography>
        </Section>

        <Section title="Buttons">
          <View style={styles.row}>
            <Button onPress={() => {}} mode="filled">
              Filled
            </Button>
            <Button onPress={() => {}} mode="tonal">
              Tonal
            </Button>
            <Button onPress={() => {}} mode="outlined">
              Outlined
            </Button>
          </View>
          <View style={styles.row}>
            <Button onPress={() => {}} mode="filled" iconName="plus">
              With Icon
            </Button>
            <Button onPress={() => {}} mode="filled" loading>
              Loading
            </Button>
            <Button onPress={() => {}} mode="filled" disabled>
              Disabled
            </Button>
          </View>
        </Section>

        <Section title="Inputs & Selection">
          <Input
            label="Standard Input"
            placeholder="Type something..."
            value={inputValue}
            onChangeText={setInputValue}
          />
          <Input
            label="Input with Error"
            placeholder="Error state"
            error="This field is required"
            value=""
            onChangeText={() => {}}
          />
          <Select
            label="Select (Single)"
            options={[
              { id: "1", label: "Option 1", value: "opt1" },
              { id: "2", label: "Option 2", value: "opt2" },
              { id: "3", label: "Option 3", value: "opt3" },
            ]}
            value={selectValue}
            onSelect={setSelectValue}
          />
          <NumericInput
            label="Numeric Input"
            value={numericValue}
            onChangeText={setNumericValue}
          />
          <Spinner
            label="Spinner Control"
            value={spinnerValue}
            onChange={setSpinnerValue}
            min={0}
            max={20}
          />
          <DateTimePicker
            label="Date Picker"
            value={dateValue}
            onChange={setDateValue}
          />
          <View style={styles.row}>
            <Checkbox
              label="Checkbox"
              checked={checkboxValue}
              onValueChange={setCheckboxValue}
            />
            <Toggle value={toggleValue} onValueChange={setToggleValue} />
          </View>
          <View style={styles.mt}>
            <ToggleButtonGroup
              options={[
                { label: "Left", value: "left", icon: "format-align-left" },
                {
                  label: "Center",
                  value: "center",
                  icon: "format-align-center",
                },
                { label: "Right", value: "right", icon: "format-align-right" },
              ]}
              value={toggleGroupValue}
              onValueChange={setToggleGroupValue}
            />
          </View>
        </Section>

        <Section title="Chips & Badges">
          <View style={styles.row}>
            <Chip label="Filled Chip" mode="filled" />
            <Chip label="Tonal Chip" mode="tonal" selected />
            <Chip label="Outlined" mode="outlined" onClose={() => {}} />
          </View>
          <View style={styles.row}>
            <View
              style={{
                width: 40,
                height: 40,
                backgroundColor: theme.colors.surfaceVariant,
                borderRadius: 8,
              }}
            >
              <Badge count={5} />
            </View>
            <IconBadge iconName="bell" badgeCount={12} />
            <StatusBadge type="success" label="Online" />
            <StatusBadge type="error" label="Busy" />
          </View>
        </Section>

        <Section title="Avatars">
          <View style={styles.row}>
            <Avatar name="John Doe" size={40} />
            <Avatar name="Jane Smith" size={56} status="online" />
            <Avatar
              icon="account-group"
              size={48}
              backgroundColor={theme.colors.secondaryContainer}
            />
          </View>
        </Section>

        <Section title="Containers">
          <Card variant="filled" style={styles.card}>
            <Typography variant="titleMedium">Filled Card</Typography>
            <Typography variant="titleSmall">
              This is a standard filled card container.
            </Typography>
          </Card>
          <Card variant="outlined" style={styles.card}>
            <Typography variant="titleMedium">Outlined Card</Typography>
          </Card>
          <Card variant="glow" style={styles.card}>
            <Typography variant="titleMedium">Glow Card</Typography>
            <Typography variant="titleSmall">
              Interactive-style glow applied permanent.
            </Typography>
          </Card>
          <Paper elevation={2} style={styles.card}>
            <Typography variant="titleMedium">
              Paper with elevation 2
            </Typography>
          </Paper>
        </Section>

        <Section title="Navigation & Disclosure">
          <Stepper
            steps={["Step 1", "Step 2", "Step 3"]}
            activeStep={activeStep}
            onStepPress={setActiveStep}
            style={{ marginBottom: 24 }}
          />
          <Tabs
            tabs={["Tab 1", "Tab 2", "Tab 3"]}
            activeTab={activeTab}
            onChange={setActiveTab}
          />
          <Accordion title="Expansion Panel">
            <Typography variant="titleSmall">
              This is the hidden content inside the accordion. It supports any
              React component.
            </Typography>
          </Accordion>
        </Section>

        <Section title="Lists & Popovers">
          <Card style={styles.card}>
            <ListItem onPress={() => {}}>List Item 1</ListItem>
            <Divider />
            <ListItem onPress={() => {}}>List Item 2</ListItem>
          </Card>

          <View style={styles.row}>
            <Popover
              visible={modalVisible} // Reuse for demo
              onDismiss={() => setModalVisible(false)}
              anchor={
                <Button onPress={() => setModalVisible(true)}>
                  Show Popover
                </Button>
              }
            >
              <View style={{ padding: 16 }}>
                <Typography variant="titleSmall">Popover Content</Typography>
                <Typography variant="labelSmall">
                  Floating above the anchor
                </Typography>
              </View>
            </Popover>
          </View>
        </Section>

        <SpeedDial
          mainIcon="plus"
          actions={[
            { id: "1", label: "Action 1", icon: "pencil", onPress: () => {} },
            { id: "2", label: "Action 2", icon: "share", onPress: () => {} },
          ]}
        />

        <Section title="Progress & Feedback">
          <Typography variant="labelMedium">Linear Progress</Typography>
          <LinearProgress progress={0.6} />
          <View style={[styles.row, styles.mt]}>
            <CircularProgress size={40} />
            <Button onPress={() => setModalVisible(true)}>Open Modal</Button>
            <Button onPress={() => setConfirmVisible(true)} mode="outlined">
              Confirm Dialog
            </Button>
          </View>
          <Button
            onPress={() => setSnackbarVisible(true)}
            mode="tonal"
            style={styles.mt}
          >
            Show Snackbar
          </Button>
        </Section>

        <Section title="Data Grid">
          <View style={styles.row}>
            <Button
              onPress={() =>
                setGridDensity(gridDensity === "normal" ? "dense" : "normal")
              }
              mode="outlined"
              iconName={
                gridDensity === "normal" ? "view-headline" : "view-sequential"
              }
            >
              Toggle Density ({gridDensity})
            </Button>
            <Typography variant="labelSmall">
              Scroll horizontally and vertically. Move columns using buttons in
              header.
            </Typography>
          </View>
          <View style={{ height: 400 }}>
            <DataGrid
              data={gridData}
              columns={gridColumns}
              density={gridDensity}
              sortColumn={sortCol}
              sortDirection={sortDir}
              onSort={handleSort}
              onEndReached={loadMoreGridData}
              loading={gridLoading}
              onColumnReorder={setGridColumns}
            />
          </View>
        </Section>

        <View style={styles.footer} />
      </ScrollView>

      {/* Overlays */}
      <Modal
        visible={modalVisible}
        title="Example Modal"
        onClose={() => setModalVisible(false)}
      >
        <Typography variant="titleSmall">
          This is a beautiful modal following the Glowup design language.
        </Typography>
      </Modal>

      <ConfirmDialog
        visible={confirmVisible}
        title="Are you sure?"
        message="This action cannot be undone. Do you wish to continue?"
        onConfirm={() => setConfirmVisible(false)}
        onCancel={() => setConfirmVisible(false)}
      />

      <Snackbar
        visible={snackbarVisible}
        message="Action completed successfully!"
        type="success"
        onDismiss={() => setSnackbarVisible(false)}
        action={{
          label: "Undo",
          onPress: () => console.log("Undo"),
        }}
      />

      <FAB
        icon="plus"
        onPress={() => setSnackbarVisible(true)}
        label="Quick Action"
        size="extended"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    marginBottom: 8,
    opacity: 0.7,
  },
  divider: {
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  card: {
    marginBottom: 12,
  },
  mt: {
    marginTop: 12,
  },
  footer: {
    height: 40,
  },
});

export default Playground;
