import { useMemo, useState } from "react";
import { StyleSheet, View, ScrollView } from "react-native";
import {
  useTheme,
  Theme,
  Typography as Title,
  Button,
  FAB,
  SpeedDial,
  SpeedDialAction,
  Alert,
  Spinner,
  ToggleButton,
  ToggleButtonGroup,
  Input,
  Divider,
  Chip,
  NumericInput,
  Checkbox,
  Card,
  Paper,
  LinearProgress,
  CircularProgress,
  Accordion,
  Tabs,
  TabContent,
  Toggle,
  Badge,
  StatusBadge,
  IconBadge,
  Avatar,
  Modal,
  ConfirmDialog,
} from "@its/glowup-ui";

import { useTranslation } from "react-i18next";

function Start() {
  const { theme, toggleTheme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const [spinnerValue, setSpinnerValue] = useState(50);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(false);
  const [lang, setLang] = useState("en");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [number, setNumber] = useState("0");
  const [checked, setChecked] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [activeTab2, setActiveTab2] = useState(0);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const { t } = useTranslation();
  /*   const {
    workOrders,
    loadWorkOrders,
    addWorkOrder,
    deleteWorkOrder,
    updateWorkOrder,
  } = useWorkOrderContext(); */
  /* 






  const [datetime, setDatetime] = useState(new Date());
  const [date, setDate] = useState(new Date());
 */
  /*   useEffect(() => {
    async function load() {
      await loadWorkOrders();
    }
    load();
  }, []); */

  const actions: SpeedDialAction[] = [
    {
      id: 1,
      icon: "camera",
      label: "Take Photo",
      onPress: () => console.log("Photo"),
    },
    {
      id: 2,
      icon: "file-document",
      label: "Attach File",
      onPress: () => console.log("File"),
    },
    {
      id: 3,
      icon: "email",
      label: "Send Email",
      onPress: () => console.log("Email"),
    },
  ];

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <View style={[styles.baseScreen, styles.container]}>
        <Title variant="displayMedium">Playground Glowup</Title>
        <Button onPress={() => toggleTheme()} mode="outlined">
          Toggle Theme
        </Button>
        <Accordion
          title="Accordion Input text"
          onPress={() => {}}
          startExpanded={true}
          titleStyle={{ fontSize: 24 }}
        >
          <View style={{ flexDirection: "column", width: "100%" }}>
            <Input
              label="Search"
              placeholder="Search your items..."
              value={search}
              variant="outlined"
              onChangeText={setSearch}
              leadingIcon="magnify"
              multiline={true}
              numberOfLines={4}
              minHeight={56}
            />
            <Input
              variant="filled"
              label="Password"
              secureTextEntry={!showPass}
              value={password}
              onChangeText={setPassword}
              trailingIcon={showPass ? "eye-off" : "eye"}
              onTrailingIconPress={() => setShowPass(!showPass)}
              error={password.length < 8 ? "Password too short" : ""}
            />
            <NumericInput
              variant="filled"
              precision={2}
              prefix="€"
              label="Numero"
              placeholder="Inserisci l'importo..."
              value={number}
              onChangeText={setNumber}
              error={Number(number) > 100 ? "numero troppo grande" : ""}
            />
          </View>
        </Accordion>
        <Tabs
          tabs={[
            { label: "Home", icon: "home" },
            { label: "Search", icon: "magnify" },
            { label: "Profile", icon: "account" },
          ]}
          activeTab={activeTab}
          onChange={(index) => setActiveTab(index)}
        ></Tabs>
        <Tabs
          tabs={["Home", "Search", "Profile"]}
          activeTab={activeTab2}
          onChange={(index) => setActiveTab2(index)}
        ></Tabs>
        <TabContent activeTab={activeTab2}>
          <View style={{ flexDirection: "row", flex: 1 }}>
            <Toggle
              value={selected}
              onValueChange={() => setSelected(!selected)}
            />
            <Badge count={2}></Badge>
            <StatusBadge label="Online" type="success" />
            <IconBadge
              iconName="information"
              badgeCount={99}
              onPress={() => Alert("IconBadge", "Premuto")}
            />
            <Avatar
              onPress={() => Alert("Avatar", "Premuto")}
              status="online"
              name="Adriano Buscema"
            />
          </View>
          <Title variant="displaySmall">displaySmall 2 </Title>
          <Title variant="displaySmall">displaySmall 3</Title>
        </TabContent>
        <LinearProgress progress={95} indeterminate={true}></LinearProgress>
        <CircularProgress />
        <View style={{ flexDirection: "row", flex: 1 }}>
          <Button
            iconName="plus"
            onPress={() => Alert("Icon button", "Premuto")}
            loading={true}
          >
            {t("ADD")}
          </Button>
          <Button
            iconName="minus"
            mode="tonal"
            onPress={() => setConfirmVisible(true)}
          />
        </View>
        <SpeedDial actions={actions} mainIcon="pencil" />
        <FAB
          onPress={() => {
            Alert("FAB", "Premuto");
          }}
          icon="plus"
          position="top-right"
          label="FAB Test"
        />
        <Spinner
          label="spinner"
          value={spinnerValue}
          onChange={(val) => setSpinnerValue(val)}
          min={0}
          max={100}
          step={10}
        />
        <View style={{ flexDirection: "row" }}>
          <Chip
            onClose={() => {}}
            label="test"
            icon="information"
            selected={selected}
            onPress={() => {
              setSelected(!selected);
            }}
          />
          <Chip
            onClose={() => {}}
            label="test"
            icon="information"
            selected={selected}
            onPress={() => {
              setSelected(!selected);
            }}
          />
        </View>

        <Modal
          visible={modalVisible}
          onClose={() => {
            setModalVisible(false);
          }}
        >
          This is a modal!
        </Modal>
        <ConfirmDialog
          visible={confirmVisible}
          title="Confirm Delete"
          message="Are you sure you want to delete this item?"
          onConfirm={() => {
            setConfirmVisible(false);
          }}
          onCancel={() => {
            setConfirmVisible(false);
          }}
        />
        <View style={{ flexDirection: "row" }}>
          <ToggleButton
            icon="apple"
            label="Apple"
            active={true}
            onPress={() => {}}
            isFirst={true}
          />
          <ToggleButton
            icon="apple"
            label="Apple"
            active={false}
            onPress={() => {}}
            isLast={true}
          />

          <ToggleButtonGroup
            value={lang}
            onValueChange={setLang}
            accessibilityLabel="Demo language"
            options={[
              { label: "EN", value: "en", icon: "translate" },
              { label: "IT", value: "it", icon: "translate" },
              { label: "ES", value: "es", icon: "translate" },
            ]}
          />
        </View>
        <Divider>
          <Chip
            onClose={() => {}}
            label="test"
            icon="information"
            selected={selected}
            onPress={() => {
              setSelected(!selected);
            }}
          />
        </Divider>
        <Checkbox
          label="prova checkbox"
          checked={checked}
          onValueChange={() => {
            setChecked(!checked);
          }}
          labelPosition="right"
        />
        <View style={{ flexDirection: "row", width: "100%", height: 75 }}>
          <Card onPress={() => {}} variant="outlined">
            <Title variant="displaySmall">displaySmall</Title>
            <Title variant="titleLarge">titleLarge</Title>
          </Card>
          <Paper>
            <Title variant="displaySmall">displaySmall</Title>
          </Paper>
        </View>
        {/* <View style={{ width: "100%", alignItems: "center" }}>
          <Select
            label="campo select"
            options={[
              { id: "0", value: null, label: "---" },
              {
                id: "1",
                value: "option1",
                label: "Option 1",
                icon: "information",
              },
              {
                id: "2",
                value: "option2",
                label: "Option 2",
                icon: "api",
              },
              { id: "3", value: "option3", label: "Option 3", icon: "apple" },
            ]}
            onSelect={(val) => setSelectedValue(val)}
            placeholder="Seleziona un'opzione"
            disabled={false}
            variant="outline"
            value={selectedValue}
            style={{ width: "50%" }}
          />
          <Select
            label="campo select"
            options={[
              {
                id: "1",
                value: "option1",
                label: "Option 1",
                icon: "information",
              },
              {
                id: "2",
                value: "option2",
                label: "Option 2",
                icon: "translation",
              },
              { id: "3", value: "option3", label: "Option 3" },
              { id: "4", value: "option4", label: "Option 4" },
              { id: "5", value: "option5", label: "Option 5" },
              { id: "6", value: "option6", label: "Option 6" },
            ]}
            onSelect={(val) => console.log(val)}
            placeholder="Seleziona un'opzione"
            disabled={false}
            variant="filled"
            style={{ width: "30%" }}
            multiSelect={true}
            selectedValues={selectedValues}
            showAsChips={true}
            toggleOptions={(val) => setSelectedValues(val)}
          />
        </View> */}
      </View>
    </ScrollView>
  );

  /*     
      <View style={[styles.baseScreen, styles.container]}>
        <View
          style={{
            flexDirection: "row",
            alignContent: "center",
            width: "100%",
          }}
        >
          <DateTimePicker
            label="data ora"
            value={datetime}
            onChange={setDatetime}
            mode="datetime"
          />
          <DateTimePicker
            value={date}
            onChange={setDate}
            mode="date"
            label="data"
          />
          <DateTimePicker
            value={date}
            onChange={setDate}
            mode="time"
            label="ora"
          />

        </View>


        
 
        
        

        {/*         <FlatList
          style={{ width: "100%" }}
          data={workOrders}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ListItem
              itemTextStyle={{ textAlign: "left" }}
              onPress={() => {
                Alert("Work Order", `You selected work order ${item.title}`);
              }}
            >
              {item.title}
            </ListItem>
          )}
        /> 
      </View>
    </ScrollView> 
  );
}*/
}

export default Start;

const makeStyles: (theme: Theme) => StyleSheet.NamedStyles<any> = (
  theme: Theme,
) =>
  StyleSheet.create({
    baseScreen: {
      backgroundColor: theme.colors.background,
      padding: theme.spacing.m,
    },
    container: {
      alignItems: "center",
      justifyContent: "center",
      width: "100%",
    },
  });
